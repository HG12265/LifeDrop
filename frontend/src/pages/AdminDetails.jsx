import React, { useEffect, useState } from 'react';
import { API_URL } from '../config'; 
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
// Link2 icon-ah import-la add panni irukken nanba
import { ArrowLeft, MapPin, ShieldCheck, Phone, Search, FileSpreadsheet, FileText, Link2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminDetails = () => {
  const { category } = useParams(); 
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type'); 
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let url = '';
    if (category === 'users') url = `${API_URL}/api/admin/all-users`;
    if (category === 'donors') url = `${API_URL}/api/admin/donors-detailed`;
    if (category === 'requests') url = `${API_URL}/api/admin/requests-detailed?type=${type}`;
    
    fetch(url).then(res => res.json()).then(data => setList(data));
  }, [category, type]);

  const filteredList = list.filter(item => 
    (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.patient && item.patient.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.blood && item.blood.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportToExcel = () => {
    const fileName = `LifeDrop_${category}_Report.xlsx`;
    const worksheet = XLSX.utils.json_to_sheet(filteredList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, fileName);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const title = `LifeDrop ${category.toUpperCase()} Report`;
      doc.setFontSize(20);
      doc.setTextColor(220, 38, 38);
      doc.text(title, 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      let columns = [];
      let rows = [];

      if(category === 'users') {
          columns = ["Name", "Email", "Role", "Phone"];
          rows = filteredList.map(item => [item.name, item.email, item.role, item.phone]);
      } else if(category === 'donors') {
          columns = ["Status", "Name", "ID", "Blood", "Health", "Phone"];
          rows = filteredList.map(item => [item.status, item.name, item.u_id, item.blood, `${item.health}%`, item.phone]);
      } else {
          columns = ["Patient", "Group", "Requester", "Donor", "Hospital"];
          rows = filteredList.map(item => [item.patient, item.blood, item.requester, item.donor || "N/A", item.hospital]);
      }

      autoTable(doc, {
        startY: 40,
        head: [columns],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38] }
      });

      doc.save(`LifeDrop_${category}_Report.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="bg-slate-100 p-2 rounded-xl text-slate-500 hover:text-red-600 transition"><ArrowLeft/></button>
            <div>
               <h2 className="text-2xl font-black capitalize text-gray-800">
                 {type === 'completed' ? 'Life Saves' : type ? type : 'Total'} {category}
               </h2>
               <p className="text-[10px] font-black text-red-600 uppercase tracking-widest italic">Report Audit</p>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl font-black text-xs border border-green-100"><FileSpreadsheet size={16}/> EXCEL</button>
            <button onClick={exportToPDF} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-xs hover:bg-black transition shadow-lg"><FileText size={16}/> PDF</button>
            <div className="relative">
                <input 
                  type="text" placeholder="Search..." 
                  className="p-2 pl-8 bg-slate-50 rounded-xl border-none outline-red-200 font-bold text-xs"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-2 top-2.5 text-gray-300" size={14} />
            </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-[0.2em] font-black">
              <tr>
                {category === 'users' && <><th className="p-6">Name</th><th className="p-6">Email</th><th className="p-6">Role</th><th className="p-6">Phone</th></>}
                {category === 'donors' && <><th className="p-6">Status</th><th className="p-6">Donor Details</th><th className="p-6">Blood</th><th className="p-6">Health</th><th className="p-6">Location</th></>}
                {category === 'requests' && <>
                  <th className="p-6">Patient</th>
                  <th className="p-6">Group</th>
                  <th className="p-6">Requester</th>
                  {type === 'completed' && <th className="p-6">Donor Hero</th>}
                  <th className="p-6">Hospital</th>
                  {/* Ledger Header added for alignment */}
                  {type === 'completed' && <th className="p-6 text-center">Ledger</th>}
                </>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition font-medium text-gray-700">
                  {category === 'users' && <>
                    <td className="p-6 font-black text-gray-800">{item.name}</td>
                    <td className="p-6 text-xs">{item.email}</td>
                    <td className="p-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.role === 'Donor' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>{item.role}</span></td>
                    <td className="p-6 text-xs">{item.phone}</td>
                  </>}
                  {category === 'donors' && <>
                    <td className="p-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{item.status}</span></td>
                    <td className="p-6"><p className="font-black text-gray-800">{item.name}</p><p className="text-[10px] text-gray-400">ID: #{item.u_id}</p></td>
                    <td className="p-6 text-xl font-black text-red-600">{item.blood}</td>
                    <td className="p-6 font-black text-green-600">{item.health}%</td>
                    <td className="p-6 text-[10px] font-bold text-gray-400">{item.location}</td>
                  </>}
                  {category === 'requests' && <>
                    <td className="p-6 font-black text-gray-800">{item.patient}</td>
                    <td className="p-6 text-xl font-black text-red-600">{item.blood}</td>
                    <td className="p-6 text-xs font-bold text-gray-500">{item.requester}</td>
                    {type === 'completed' && <td className="p-6 font-black text-green-600 text-xs uppercase">{item.donor}</td>}
                    <td className="p-6 text-xs italic text-gray-400">{item.hospital}</td>
                    {/* Blockchain Button Column */}
                    {type === 'completed' && (
                        <td className="p-6 text-center">
                           <button 
                             onClick={() => navigate(`/blockchain/${item.id}`)}
                             className="bg-slate-900 text-white p-2 rounded-lg hover:bg-red-600 transition shadow-md"
                             title="Audit Blockchain"
                           >
                             <Link2 size={16} />
                           </button>
                        </td>
                    )}
                  </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDetails;
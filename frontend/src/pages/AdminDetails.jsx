import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Activity, ShieldCheck, Mail, Phone, Search } from 'lucide-react';

const AdminDetails = () => {
  const { category } = useParams(); // users, donors, requests
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type'); 
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const filteredList = list.filter(item => 
  (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
  (item.patient && item.patient.toLowerCase().includes(searchTerm.toLowerCase())) ||
  (item.blood && item.blood.toLowerCase().includes(searchTerm.toLowerCase())) ||
  (item.role && item.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    let url = '';
    if (category === 'users') url = 'http://localhost:5000/api/admin/all-users';
    if (category === 'donors') url = 'http://localhost:5000/api/admin/donors-detailed';
    if (category === 'requests') url = `http://localhost:5000/api/admin/requests-detailed?type=${type}`;
    
    fetch(url).then(res => res.json()).then(data => setList(data));
  }, [category, type]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
        <button onClick={() => navigate(-1)} className="bg-slate-100 p-2 rounded-xl text-slate-500"><ArrowLeft/></button>
        <div>
           <h2 className="text-2xl font-black capitalize tracking-tight">{type === 'completed' ? 'Life Saves' : type ? type : 'Total'} {category}</h2>
           <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">System Record Analysis</p>
        </div>
      </div>
      <div className="relative mb-6">
        <input 
          type="text" 
          placeholder={`Search ${category} by name or blood group...`} 
          className="w-full p-4 pl-12 bg-white rounded-2xl shadow-sm border border-gray-100 outline-red-200 font-bold"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-4 top-4 text-gray-300" />
      </div>
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-[0.2em] font-black">
              <tr>
                {category === 'users' && <><th className="p-6">Name</th><th className="p-6">Email</th><th className="p-6">Role</th><th className="p-6">Phone</th></>}
                
                {category === 'donors' && <>
                  <th className="p-6">Status</th><th className="p-6">Donor Details</th><th className="p-6">Blood</th>
                  <th className="p-6">Donations</th><th className="p-6">Health</th><th className="p-6">Location</th>
                </>}

                {category === 'requests' && <>
                  <th className="p-6">Patient</th><th className="p-6">Group</th><th className="p-6">Requester</th>
                  {type === 'completed' && <th className="p-6 text-green-500">Donor Hero</th>}
                  <th className="p-6">Hospital</th><th className="p-6">Phone</th>
                </>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  {category === 'users' && <>
                    <td className="p-6 font-black text-gray-800">{item.name}</td>
                    <td className="p-6 text-sm text-gray-500 font-bold">{item.email}</td>
                    <td className="p-6"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.role === 'Donor' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>{item.role}</span></td>
                    <td className="p-6 text-xs font-bold text-gray-500 tracking-tighter">{item.phone}</td>
                  </>}

                  {category === 'donors' && <>
                    <td className="p-6">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.status === 'Active' ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-orange-100 text-orange-600'}`}>
                          {item.status}
                       </span>
                    </td>
                    <td className="p-6">
                       <p className="font-black text-gray-800">{item.name}</p>
                       <p className="text-[10px] font-bold text-gray-400">ID: #{item.u_id} | {item.email}</p>
                       <p className="text-[10px] font-black text-blue-500 mt-1 flex items-center gap-1"><Phone size={10}/> {item.phone}</p>
                    </td>
                    <td className="p-6 text-xl font-black text-red-600">{item.blood}</td>
                    <td className="p-6 text-center font-black text-slate-400">{item.donations}</td>
                    <td className="p-6 font-black text-green-600">{item.health}%</td>
                    <td className="p-6 text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-6"><MapPin size={12}/> {item.location}</td>
                  </>}

                  {category === 'requests' && <>
                    <td className="p-6 font-black text-gray-800">{item.patient}</td>
                    <td className="p-6 text-xl font-black text-red-600">{item.blood}</td>
                    <td className="p-6 font-bold text-gray-500">{item.requester}</td>
                    {type === 'completed' && (
                        <td className="p-6">
                           <div className="flex items-center gap-2">
                              <div className="bg-green-100 p-1.5 rounded-full text-green-600 font-black"><ShieldCheck size={14}/></div>
                              <span className="font-black text-green-700 text-sm">{item.donor}</span>
                           </div>
                        </td>
                      )}
                    <td className="p-6 text-sm font-bold text-slate-400 italic">{item.hospital}</td>
                    <td className="p-6 font-black text-gray-700 text-xs tracking-tighter">{item.phone}</td>
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
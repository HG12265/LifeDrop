import React, { useEffect, useState } from 'react';
import { API_URL } from '../config'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { ArrowLeft, TrendingUp, Users, Activity, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title);

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/admin/analytics`)
      .then(res => res.json())
      .then(val => setData(val));
  }, []);

  if (!data) return (
    <div className="h-screen flex items-center justify-center bg-slate-900 text-red-500 font-black text-xl animate-pulse italic">
      GENERATING NEURAL INSIGHTS...
    </div>
  );

  // Chart 1: Supply vs Demand (Bar Chart)
  const barData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Donors (Supply)',
        data: data.donors,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
      },
      {
        label: 'Requests (Demand)',
        data: data.requests,
        backgroundColor: '#ef4444',
        borderRadius: 8,
      }
    ]
  };

  // Chart 2: Success Rate (Doughnut)
  const doughnutData = {
    labels: ['Success Saves', 'Pending Requests'],
    datasets: [{
      data: [data.total_saves, data.total_requests - data.total_saves],
      backgroundColor: ['#10b981', '#f1f5f9'],
      hoverOffset: 4,
      borderWidth: 0
    }]
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8 animate-in fade-in zoom-in duration-700">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="bg-slate-100 p-2 rounded-xl text-slate-500 hover:text-red-600 transition"><ArrowLeft/></button>
           <div>
              <h2 className="text-3xl font-black italic tracking-tighter">System Analytics</h2>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Real-time Data Intelligence</p>
           </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-green-50 px-4 py-2 rounded-2xl border border-green-100">
            <TrendingUp size={16} className="text-green-600"/>
            <span className="text-xs font-black text-green-700 uppercase">System Optimized</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <KPICard label="Total Donors" value={data.total_donors} sub="Active Nodes" icon={<Users className="text-blue-600"/>} />
         <KPICard label="Total Requests" value={data.total_requests} sub="Demand Rate" icon={<Activity className="text-red-600"/>} />
         <KPICard label="Lives Saved" value={data.total_saves} sub="Success Stories" icon={<Heart className="text-green-600"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Bar Chart - Supply vs Demand */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[48px] shadow-2xl border border-gray-50">
            <div className="mb-8">
                <h3 className="font-black text-gray-800 text-xl italic uppercase">Supply vs Demand Analysis</h3>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Comparison of Donors vs Requirements per Blood Group</p>
            </div>
            <div className="h-[350px]">
                <Bar data={barData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } }} />
            </div>
        </div>

        {/* Circular Analytics - Success Ratio */}
        <div className="bg-slate-900 p-8 rounded-[48px] shadow-2xl text-white flex flex-col items-center justify-between">
            <div className="text-center">
                <h3 className="font-black text-gray-400 text-xs uppercase tracking-[0.3em] mb-2">Overall Success Ratio</h3>
                <div className="w-full max-w-[200px] mx-auto my-6">
                    <Doughnut data={doughnutData} />
                </div>
                <h4 className="text-5xl font-black italic">
                    {((data.total_saves / (data.total_requests || 1)) * 100).toFixed(1)}%
                </h4>
                <p className="text-[10px] font-bold text-green-500 uppercase mt-2 tracking-widest">Request Completion Rate</p>
            </div>
            
            <div className="w-full mt-8 p-6 bg-white/5 rounded-[32px] border border-white/5">
                <p className="text-[10px] font-black opacity-40 uppercase mb-4">Critical Insight</p>
                <p className="text-sm font-bold leading-relaxed italic">
                    {data.total_requests > data.total_donors 
                      ? "⚠️ Demand is currently exceeding supply. Increase donor outreach."
                      : "✅ System is stable. Supply meets current demand levels."}
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

const KPICard = ({ label, value, sub, icon }) => (
    <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-50 flex items-center gap-6 group hover:border-red-100 transition duration-500">
        <div className="bg-slate-50 p-4 rounded-3xl group-hover:bg-red-50 transition">{icon}</div>
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <h4 className="text-4xl font-black text-gray-800 tracking-tighter leading-none">{value}</h4>
            <p className="text-[9px] font-bold text-slate-300 mt-2 italic">{sub}</p>
        </div>
    </div>
);

export default AdminAnalytics;
import React from 'react';
import { usePikmin } from '../context/PikminContext';
import { DECOR_CATEGORIES, DECOR_STATUS, PIKMIN_COLORS } from '../constants';
import { COLORS } from '../theme/colors';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const Dashboard = () => {
    const { collection } = usePikmin();

    // Calculate Stats
    let stats = {
        [DECOR_STATUS.NOT_COLLECTED]: 0,
        [DECOR_STATUS.SEEDLING]: 0,
        [DECOR_STATUS.GROWING]: 0,
        [DECOR_STATUS.COLLECTED]: 0,
        total: 0
    };

    DECOR_CATEGORIES.forEach(cat => {
        cat.variants.forEach(variant => {
            variant.colors.forEach(colorId => { // Iterate only over valid colors
                // Wait, if I iterate variant.colors, I get valid colors.
                // collection[variant.id][colorId] could be undefined (0).
                const status = collection[variant.id]?.[colorId] || DECOR_STATUS.NOT_COLLECTED;
                stats[status]++;
                stats.total++;
            });
        });
    });

    const statusData = [
        { name: '已獲得', value: stats[DECOR_STATUS.COLLECTED], color: COLORS.status.collected },
        { name: '成長中', value: stats[DECOR_STATUS.GROWING], color: COLORS.status.growing },
        { name: '大苗', value: stats[DECOR_STATUS.SEEDLING], color: COLORS.status.seedling },
        { name: '未獲得', value: stats[DECOR_STATUS.NOT_COLLECTED], color: COLORS.status.missing },
    ];

    // Calculate Color Distribution (Collected Only)
    // Use COLORS.pikmin for hex values directly
    const colorData = PIKMIN_COLORS.map(c => {
        let count = 0;
        DECOR_CATEGORIES.forEach(cat => {
            cat.variants.forEach(v => {
                if(v.colors.includes(c.id)) {
                    if ((collection[v.id]?.[c.id] || 0) === DECOR_STATUS.COLLECTED) {
                        count++;
                    }
                }
            });
        });
        return { name: c.name, value: count, fill: COLORS.pikmin[c.id] };
    });


    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-10">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-stone-900">數據儀表板</h2>
                <p className="text-stone-400 font-bold">收藏進度與皮克敏分佈概覽</p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <StatCard 
                    value={stats[DECOR_STATUS.COLLECTED]} 
                    label="已收藏" 
                    color="text-brand-primary" 
                    bg="bg-white border border-stone-100"
                />
                <StatCard 
                    value={stats[DECOR_STATUS.GROWING]} 
                    label="成長中" 
                    color="text-brand-secondary" 
                    bg="bg-white border border-stone-100"
                />
                <StatCard 
                    value={stats[DECOR_STATUS.SEEDLING]} 
                    label="大苗" 
                    color="text-brand-accent" 
                    bg="bg-white border border-stone-100"
                />
                <StatCard 
                    value={stats[DECOR_STATUS.NOT_COLLECTED]} 
                    label="未獲得" 
                    color="text-stone-300" 
                    bg="bg-white border border-stone-100"
                />
            </div>


            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Status Distribution */}
                <div className="glass-panel p-8 rounded-4xl h-[350px] flex flex-col">
                    <h3 className="text-lg font-black text-stone-900 mb-4">全體比例</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.color} 
                                            stroke="white"
                                            strokeWidth={2}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Color Distribution */}
                <div className="glass-panel p-8 rounded-4xl h-[350px] flex flex-col">
                     <h3 className="text-lg font-black text-stone-900 mb-4">皮克敏色系分佈</h3>
                     <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={colorData}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                               <XAxis dataKey="name" tick={{fontSize: 10, fill: '#78716c'}} interval={0} axisLine={false} tickLine={false} />
                               <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#78716c'}} />
                               <Tooltip 
                                   cursor={{fill: 'rgba(120, 113, 108, 0.05)'}}
                                   contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}
                               />
                               <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                   {colorData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.fill} />
                                   ))}
                               </Bar>
                           </BarChart>
                       </ResponsiveContainer>
                     </div>
                </div>

            </div>
            
            <div className="text-center text-sm text-lime-900/40 font-bold pb-10">
                總計裝飾品項: {stats.total}
            </div>
        </div>
    );
};

const StatCard = ({ value, label, color, bg }) => (
    <div className={`soft-card p-6 text-center ${bg} group`}>
        <div className={`text-4xl font-black mb-1 transition-transform group-hover:scale-110 ${color}`}>
            {value}
        </div>
        <div className="text-sm font-bold text-lime-900/40">{label}</div>
    </div>
);

export default Dashboard;

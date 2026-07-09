import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Sun, Wheat, Fish } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/projects')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!data) return <div className="flex items-center justify-center h-screen">Loading MX PS Niger State Data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-green-800">MX PS Niger State</h1>
        <p className="text-xl text-gray-600">Electricity • Farming • Fishing Initiative</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex items-center gap-4">
            <Sun className="w-12 h-12 text-yellow-500" />
            <div>
              <h3 className="text-2xl font-bold">{data.electricity?.capacityMW || 100} MW</h3>
              <p>Solar Power Capacity</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex items-center gap-4">
            <Wheat className="w-12 h-12 text-amber-600" />
            <div>
              <h3 className="text-2xl font-bold">{data.farming?.hectaresCultivated || 500} ha</h3>
              <p>Cultivated Land</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex items-center gap-4">
            <Fish className="w-12 h-12 text-blue-600" />
            <div>
              <h3 className="text-2xl font-bold">{data.fishing?.harvestKg || 2500} kg</h3>
              <p>Recent Harvest</p>
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={[{name: 'Electricity', value: data.electricity?.generatedToday || 80}, 
                         {name: 'Farming', value: data.farming?.yieldTons || 120}, 
                         {name: 'Fishing', value: data.fishing?.harvestKg / 10 || 250}]}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#166534" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Dashboard;
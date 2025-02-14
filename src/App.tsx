import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight, Server, Shield, RefreshCcw } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';

type ChangeType = 'software-update' | 'server-migration' | 'security-patch';
type Urgency = 'low' | 'medium' | 'high';
type RollbackComplexity = 'easy' | 'medium' | 'hard';

interface PredictionResult {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  strategies: string[];
  confidence: number;
}

function App() {
  const [session, setSession] = useState<boolean>(false);
  const [changeType, setChangeType] = useState<ChangeType>('software-update');
  const [affectedSystems, setAffectedSystems] = useState<number>(1);
  const [urgency, setUrgency] = useState<Urgency>('low');
  const [rollbackComplexity, setRollbackComplexity] = useState<RollbackComplexity>('easy');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const predictRisk = async () => {
    // Simulated AI prediction logic
    const riskScore = 
      (changeType === 'server-migration' ? 3 : 
       changeType === 'security-patch' ? 2 : 1) +
      (affectedSystems > 10 ? 3 : affectedSystems > 5 ? 2 : 1) +
      (urgency === 'high' ? 3 : urgency === 'medium' ? 2 : 1) +
      (rollbackComplexity === 'hard' ? 3 : rollbackComplexity === 'medium' ? 2 : 1);

    const result: PredictionResult = {
      riskLevel: riskScore > 10 ? 'Critical' : 
                 riskScore > 8 ? 'High' : 
                 riskScore > 6 ? 'Medium' : 'Low',
      confidence: 85 + Math.random() * 10,
      strategies: [
        'Implement comprehensive testing in staging environment',
        'Schedule change during off-peak hours',
        'Prepare detailed rollback plan',
        'Monitor system metrics closely during implementation',
        'Have key stakeholders on standby during deployment'
      ]
    };

    setPrediction(result);

    // Store the analysis in Supabase
    await supabase.from('risk_analysis_history').insert([{
      change_type: changeType,
      affected_systems: affectedSystems,
      urgency: urgency,
      rollback_complexity: rollbackComplexity,
      risk_level: result.riskLevel,
      confidence: result.confidence
    }]);
  };

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'Critical': return 'text-red-500';
      case 'High': return 'text-orange-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-white';
    }
  };

  if (!session) {
    return <Auth onSignIn={() => setSession(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Server className="w-8 h-8" />
              AI Change Management System
            </h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Change Type</label>
                  <select
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2"
                    value={changeType}
                    onChange={(e) => setChangeType(e.target.value as ChangeType)}
                  >
                    <option value="software-update">Software Update</option>
                    <option value="server-migration">Server Migration</option>
                    <option value="security-patch">Security Patch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Affected Systems</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2"
                    value={affectedSystems}
                    onChange={(e) => setAffectedSystems(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Change Urgency</label>
                  <select
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as Urgency)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rollback Complexity</label>
                  <select
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2"
                    value={rollbackComplexity}
                    onChange={(e) => setRollbackComplexity(e.target.value as RollbackComplexity)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={predictRisk}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              Predict Risk
            </button>
          </div>

          {prediction && (
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Risk Assessment
                </h2>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-sm">Risk Level:</span>
                  <span className={`text-lg font-bold ${getRiskColor(prediction.riskLevel)}`}>
                    {prediction.riskLevel}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  Confidence: {prediction.confidence.toFixed(1)}%
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <RefreshCcw className="w-5 h-5" />
                  Mitigation Strategies
                </h3>
                <ul className="space-y-3">
                  {prediction.strategies.map((strategy, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <ArrowRight className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-400" />
                      <span className="text-gray-300">{strategy}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
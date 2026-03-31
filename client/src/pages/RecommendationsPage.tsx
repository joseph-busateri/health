import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Filter, TrendingUp } from 'lucide-react';
import RecommendationCard from '../components/RecommendationCard';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  rationale: string;
  intended_outcome: string;
  action_items?: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'today' | 'this_week' | 'this_month' | 'long_term';
  category: string;
  source: string;
  confidence: number;
  ai_generated: boolean;
  status: string;
  created_at: string;
}

const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    acceptanceRate: 0
  });

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recommendations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.data.recommendations);
        calculateStats(data.data.recommendations);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          force_regenerate: true,
          use_ai_enhancement: true
        })
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchRecommendations();
      }
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setGenerating(false);
    }
  };

  const calculateStats = (recs: Recommendation[]) => {
    const total = recs.length;
    const critical = recs.filter(r => r.priority === 'critical').length;
    const high = recs.filter(r => r.priority === 'high').length;
    const medium = recs.filter(r => r.priority === 'medium').length;
    const low = recs.filter(r => r.priority === 'low').length;
    
    const accepted = recs.filter(r => r.status === 'accepted').length;
    const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;

    setStats({ total, critical, high, medium, low, acceptanceRate });
  };

  const handleAccept = async (id: string, notes?: string) => {
    try {
      const response = await fetch(`/api/recommendations/${id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_notes: notes })
      });
      
      if (response.ok) {
        await fetchRecommendations();
      }
    } catch (error) {
      console.error('Failed to accept recommendation:', error);
    }
  };

  const handleDismiss = async (id: string, reason?: string, notes?: string) => {
    try {
      const response = await fetch(`/api/recommendations/${id}/dismiss`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          dismissal_reason: reason,
          user_notes: notes 
        })
      });
      
      if (response.ok) {
        await fetchRecommendations();
      }
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const priorityMatch = filterPriority === 'all' || rec.priority === filterPriority;
    const statusMatch = filterStatus === 'all' || rec.status === filterStatus;
    return priorityMatch && statusMatch;
  });

  const groupedByPriority = {
    critical: filteredRecommendations.filter(r => r.priority === 'critical'),
    high: filteredRecommendations.filter(r => r.priority === 'high'),
    medium: filteredRecommendations.filter(r => r.priority === 'medium'),
    low: filteredRecommendations.filter(r => r.priority === 'low')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Health Recommendations</h1>
        <p className="text-gray-600">Personalized insights based on your health data</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <div className="text-sm text-red-600 mb-1">Critical</div>
          <div className="text-2xl font-bold text-red-900">{stats.critical}</div>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-4">
          <div className="text-sm text-orange-600 mb-1">High</div>
          <div className="text-2xl font-bold text-orange-900">{stats.high}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <div className="text-sm text-yellow-600 mb-1">Medium</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.medium}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <div className="text-sm text-blue-600 mb-1">Acceptance</div>
          <div className="text-2xl font-bold text-blue-900">{stats.acceptanceRate.toFixed(0)}%</div>
        </div>
      </div>

      {/* Actions & Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="accepted">Accepted</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
        <button
          onClick={generateRecommendations}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              <span>Generate New</span>
            </>
          )}
        </button>
      </div>

      {/* Recommendations by Priority */}
      {filteredRecommendations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recommendations</h3>
          <p className="text-gray-600 mb-6">Generate your first set of personalized recommendations</p>
          <button
            onClick={generateRecommendations}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg inline-flex items-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Generate Recommendations</span>
          </button>
        </div>
      ) : (
        <>
          {groupedByPriority.critical.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-red-900 mb-4 flex items-center">
                <span className="bg-red-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                  {groupedByPriority.critical.length}
                </span>
                Critical Priority
              </h2>
              {groupedByPriority.critical.map(rec => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onAccept={handleAccept}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          )}

          {groupedByPriority.high.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-orange-900 mb-4 flex items-center">
                <span className="bg-orange-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                  {groupedByPriority.high.length}
                </span>
                High Priority
              </h2>
              {groupedByPriority.high.map(rec => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onAccept={handleAccept}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          )}

          {groupedByPriority.medium.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-yellow-900 mb-4 flex items-center">
                <span className="bg-yellow-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                  {groupedByPriority.medium.length}
                </span>
                Medium Priority
              </h2>
              {groupedByPriority.medium.map(rec => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onAccept={handleAccept}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          )}

          {groupedByPriority.low.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
                <span className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                  {groupedByPriority.low.length}
                </span>
                Low Priority
              </h2>
              {groupedByPriority.low.map(rec => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onAccept={handleAccept}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecommendationsPage;

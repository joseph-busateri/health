import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: {
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
  };
  onAccept: (id: string, notes?: string) => void;
  onDismiss: (id: string, reason?: string, notes?: string) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onAccept,
  onDismiss
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [dismissReason, setDismissReason] = useState('');

  const priorityColors = {
    critical: 'bg-red-100 border-red-500 text-red-900',
    high: 'bg-orange-100 border-orange-500 text-orange-900',
    medium: 'bg-yellow-100 border-yellow-500 text-yellow-900',
    low: 'bg-blue-100 border-blue-500 text-blue-900'
  };

  const priorityIcons = {
    critical: <AlertTriangle className="w-5 h-5" />,
    high: <TrendingUp className="w-5 h-5" />,
    medium: <Clock className="w-5 h-5" />,
    low: <Clock className="w-5 h-5" />
  };

  const timeframeLabels = {
    immediate: 'Act Now',
    today: 'Today',
    this_week: 'This Week',
    this_month: 'This Month',
    long_term: 'Long Term'
  };

  const handleAccept = () => {
    onAccept(recommendation.id, userNotes);
    setShowAcceptModal(false);
    setUserNotes('');
  };

  const handleDismiss = () => {
    onDismiss(recommendation.id, dismissReason, userNotes);
    setShowDismissModal(false);
    setDismissReason('');
    setUserNotes('');
  };

  return (
    <>
      <div className={`border-l-4 rounded-lg shadow-md p-6 mb-4 ${priorityColors[recommendation.priority]}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className="mt-1">
              {priorityIcons[recommendation.priority]}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">{recommendation.title}</h3>
              <div className="flex items-center space-x-3 text-sm opacity-75">
                <span className="font-semibold">{recommendation.priority.toUpperCase()}</span>
                <span>•</span>
                <span>{timeframeLabels[recommendation.timeframe]}</span>
                <span>•</span>
                <span className="capitalize">{recommendation.category.replace(/_/g, ' ')}</span>
                {recommendation.ai_generated && (
                  <>
                    <span>•</span>
                    <span className="italic">AI Enhanced</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="text-sm font-semibold opacity-75">
            {(recommendation.confidence * 100).toFixed(0)}% confidence
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className="text-base leading-relaxed">{recommendation.description}</p>
        </div>

        {/* Toggle Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm font-semibold underline mb-4 hover:opacity-75"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        {/* Expanded Details */}
        {showDetails && (
          <div className="space-y-4 mb-4 bg-white bg-opacity-50 rounded-lg p-4">
            {/* Rationale */}
            <div>
              <h4 className="font-bold text-sm mb-2">Why This Matters:</h4>
              <p className="text-sm leading-relaxed">{recommendation.rationale}</p>
            </div>

            {/* Intended Outcome */}
            <div>
              <h4 className="font-bold text-sm mb-2">Expected Outcome:</h4>
              <p className="text-sm leading-relaxed">{recommendation.intended_outcome}</p>
            </div>

            {/* Action Items */}
            {recommendation.action_items && recommendation.action_items.length > 0 && (
              <div>
                <h4 className="font-bold text-sm mb-2">Action Steps:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  {recommendation.action_items.map((item, index) => (
                    <li key={index} className="text-sm leading-relaxed">{item}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Source */}
            <div className="text-xs opacity-75">
              <span className="font-semibold">Source:</span> {recommendation.source.replace(/_/g, ' ')}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {recommendation.status === 'active' && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAcceptModal(true)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Accept & Implement</span>
            </button>
            <button
              onClick={() => setShowDismissModal(true)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              <span>Dismiss</span>
            </button>
          </div>
        )}

        {/* Status Badge */}
        {recommendation.status !== 'active' && (
          <div className="mt-4 inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold">
            {recommendation.status === 'accepted' ? '✓ Accepted' : '✗ Dismissed'}
          </div>
        )}
      </div>

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Accept Recommendation</h3>
            <p className="text-gray-700 mb-4">
              You're committing to implement: <strong>{recommendation.title}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Notes (optional):
              </label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                rows={3}
                placeholder="Add any notes about your implementation plan..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowAcceptModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Modal */}
      {showDismissModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Dismiss Recommendation</h3>
            <p className="text-gray-700 mb-4">
              Why are you dismissing: <strong>{recommendation.title}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Reason:
              </label>
              <select
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-3"
              >
                <option value="">Select a reason...</option>
                <option value="already_doing">Already doing this</option>
                <option value="not_applicable">Not applicable to me</option>
                <option value="too_difficult">Too difficult to implement</option>
                <option value="disagree">I disagree with this recommendation</option>
                <option value="other">Other</option>
              </select>
              <label className="block text-sm font-semibold mb-2">
                Additional Notes (optional):
              </label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                rows={3}
                placeholder="Add any additional context..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleDismiss}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
                disabled={!dismissReason}
              >
                Confirm Dismiss
              </button>
              <button
                onClick={() => setShowDismissModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecommendationCard;

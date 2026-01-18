import { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3000';

const PaymentGateway = ({ complaint, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');

    try {
      const sessionRes = await axios.post(`${BACKEND_URL}/payments/stripe/create-session`, {
        complaintId: complaint._id,
      });

      const { sessionUrl } = sessionRes.data;

      if (!sessionUrl) {
        throw new Error('Unable to start payment session');
      }

      window.location.href = sessionUrl;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Unable to start payment';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
          onClick={onClose}
          disabled={loading}
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Stripe Test Payment</h2>
        <p className="text-gray-600 text-sm mb-4">You will be redirected to the official Stripe test Checkout page.</p>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Complaint:</span>
              <span className="text-gray-900 font-medium">{complaint.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Category:</span>
              <span className="text-gray-900">{complaint.category}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-blue-200 mt-2">
              <span>Amount:</span>
              <span className="text-blue-600">₹{complaint.payment?.amount || complaint.totalAmount || 500}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4 text-xs text-amber-800">
          <div className="font-semibold mb-1">Test Mode</div>
          <div>Use Stripe's test card on the checkout page:</div>
          <div className="font-mono text-amber-900 mt-1">4242 4242 4242 4242</div>
          <div>Any future expiry, any CVC</div>
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 transition-all"
        >
          {loading ? 'Redirecting...' : 'Pay with Stripe' }
        </button>

        <button
          onClick={onClose}
          disabled={loading}
          className="w-full mt-3 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
        >
          Cancel
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          You will be redirected to Stripe's hosted test checkout page.
        </p>
      </div>
    </div>
  );
};

export default PaymentGateway;

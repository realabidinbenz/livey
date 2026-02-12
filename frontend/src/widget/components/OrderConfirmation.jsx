import { formatPrice } from '../../utils/formatters';

/**
 * OrderConfirmation Component
 * Success modal displayed after order is placed
 * 
 * @param {Object} props
 * @param {Object} props.order - Order data
 * @param {Function} props.onClose - Callback to close the modal
 */
export function OrderConfirmation({ order, onClose }) {
    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center"
            onClick={handleBackdropClick}
        >
            <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 text-center animate-slide-up">
                {/* Success Icon */}
                <div className="w-16 h-16 bg-livey-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                        className="w-8 h-8 text-livey-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>

                {/* Title and Message */}
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Order Confirmed!
                </h2>
                <p className="text-gray-600 mb-6">
                    We'll contact you soon to confirm delivery.
                </p>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Order #</span>
                        <span className="font-mono text-gray-900">{order?.order_number || 'N/A'}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Product</span>
                        <span className="text-gray-900 text-right max-w-[60%] truncate">
                            {order?.product_name || 'Unknown Product'}
                        </span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Quantity</span>
                        <span className="text-gray-900">{order?.quantity || 1}</span>
                    </div>

                    {order?.customer_name && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Customer</span>
                            <span className="text-gray-900">{order.customer_name}</span>
                        </div>
                    )}

                    <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Total</span>
                            <span className="font-bold text-livey-primary text-lg">
                                {formatPrice(order?.total_price || 0)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Continue Button */}
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
                >
                    Continue Watching
                </button>
            </div>
        </div>
    );
}

export default OrderConfirmation;

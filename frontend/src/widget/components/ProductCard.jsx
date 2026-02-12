import { useEffect, useState } from 'react';
import { formatPrice } from '../../utils/formatters';

/**
 * ProductCard Component
 * Shows the currently pinned product with ORDER NOW button
 * 
 * @param {Object} props
 * @param {Object} props.product - Pinned product data
 * @param {boolean} props.isLive - Whether session is live
 * @param {Function} props.onOrderClick - Callback when ORDER NOW is clicked
 */
export function ProductCard({ product, isLive, onOrderClick }) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [previousProductId, setPreviousProductId] = useState(null);

    // Animation effect when product changes
    useEffect(() => {
        const currentProductId = product?.product_id;

        // Trigger animation when product changes to a different one
        if (currentProductId && currentProductId !== previousProductId) {
            setIsAnimating(true);

            // Remove animation class after 1.2 seconds
            const timer = setTimeout(() => {
                setIsAnimating(false);
            }, 1200);

            setPreviousProductId(currentProductId);

            return () => clearTimeout(timer);
        }
    }, [product?.product_id, previousProductId]);

    // No product pinned
    if (!product) {
        return (
            <div className="flex gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                    <svg
                        className="w-8 h-8 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                    </svg>
                </div>
                <div className="flex-1 flex items-center">
                    <p className="text-gray-500 text-sm italic">
                        Waiting for seller to pin a product...
                    </p>
                </div>
            </div>
        );
    }

    const { products } = product;
    const stock = products?.stock;
    const isOutOfStock = stock !== null && stock <= 0;
    const isLowStock = stock !== null && stock > 0 && stock <= 5;

    return (
        <div
            className={`flex gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 ${isAnimating ? 'ring-2 ring-livey-primary ring-opacity-50' : ''
                }`}
        >
            {/* Product image */}
            <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                {products?.image_url ? (
                    <img
                        src={products.image_url}
                        alt={products.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback if image fails to load
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                <div
                    className={`w-full h-full items-center justify-center text-gray-400 text-xs ${products?.image_url ? 'hidden' : 'flex'
                        }`}
                >
                    <svg
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                </div>
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-sm">
                    {products?.name || 'Unnamed Product'}
                </h3>
                <p className="text-lg font-bold text-livey-primary mt-0.5">
                    {formatPrice(products?.price || 0)}
                </p>

                {/* Stock indicator */}
                <div className="mt-1">
                    {isOutOfStock ? (
                        <span className="text-xs text-red-600 font-medium">
                            Out of stock
                        </span>
                    ) : isLowStock ? (
                        <span className="text-xs text-orange-600 font-medium">
                            Only {stock} left!
                        </span>
                    ) : stock !== null ? (
                        <span className="text-xs text-green-600 font-medium">
                            In stock
                        </span>
                    ) : null}
                </div>
            </div>

            {/* ORDER NOW button */}
            <button
                onClick={onOrderClick}
                disabled={isOutOfStock}
                className={`self-center px-4 py-2 font-bold rounded-lg transition-colors whitespace-nowrap text-sm ${isOutOfStock
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-livey-primary text-white hover:bg-blue-700 active:bg-blue-800'
                    }`}
            >
                {isOutOfStock ? 'SOLD OUT' : 'ORDER NOW'}
            </button>
        </div>
    );
}

export default ProductCard;

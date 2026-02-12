import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatPrice } from '../../utils/formatters';
import { createOrder } from '../services/api';

/**
 * OrderForm Component
 * Mobile drawer style order form with validation
 * 
 * @param {Object} props
 * @param {Object} props.product - Product being ordered
 * @param {string} props.sessionId - Current session ID
 * @param {Function} props.onSuccess - Callback on successful order
 * @param {Function} props.onClose - Callback to close the form
 */
export function OrderForm({ product, sessionId, onSuccess, onClose }) {
    const [submitError, setSubmitError] = useState(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        setValue
    } = useForm({
        defaultValues: {
            customer_name: '',
            customer_phone: '',
            customer_address: '',
            quantity: 1
        }
    });

    const watchedQuantity = watch('quantity', 1);
    const productPrice = product?.products?.price || 0;
    const total = productPrice * watchedQuantity;
    const productName = product?.products?.name || 'Unknown Product';
    const productImage = product?.products?.image_url;

    const onSubmit = async (data) => {
        setSubmitError(null);

        try {
            const orderData = {
                ...data,
                product_id: product.product_id,
                session_id: sessionId
            };

            const result = await createOrder(orderData);
            onSuccess(result);
        } catch (error) {
            console.error('Order submission error:', error);
            setSubmitError(
                error.message || 'Failed to place order. Please try again.'
            );
        }
    };

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
            <div className="bg-white w-full sm:max-w-md sm:rounded-t-2xl rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Place Your Order</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <svg
                            className="w-5 h-5 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Product Summary */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex gap-3">
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-gray-200">
                            {productImage ? (
                                <img
                                    src={productImage}
                                    alt={productName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{productName}</h3>
                            <p className="text-livey-primary font-bold">{formatPrice(productPrice)}</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                    {/* Error message */}
                    {submitError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{submitError}</p>
                        </div>
                    )}

                    {/* Full Name */}
                    <div>
                        <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="customer_name"
                            type="text"
                            {...register('customer_name', {
                                required: 'Name is required',
                                maxLength: { value: 100, message: 'Max 100 characters' }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-livey-primary focus:border-transparent"
                            placeholder="Enter your full name"
                        />
                        {errors.customer_name && (
                            <p className="mt-1 text-xs text-red-600">{errors.customer_name.message}</p>
                        )}
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="customer_phone"
                            type="tel"
                            {...register('customer_phone', {
                                required: 'Phone is required',
                                validate: (value) => {
                                    const normalized = value.replace(/[\s\-().]/g, '');
                                    if (!/^(0|\+?213)(5|6|7)\d{8}$/.test(normalized)) {
                                        return 'Invalid Algerian phone number';
                                    }
                                    return true;
                                }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-livey-primary focus:border-transparent"
                            placeholder="05XX XX XX XX"
                        />
                        {errors.customer_phone && (
                            <p className="mt-1 text-xs text-red-600">{errors.customer_phone.message}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Format: 05XX XX XX XX or +213 5XX XX XX XX
                        </p>
                    </div>

                    {/* Address */}
                    <div>
                        <label htmlFor="customer_address" className="block text-sm font-medium text-gray-700 mb-1">
                            Delivery Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="customer_address"
                            rows={3}
                            {...register('customer_address', {
                                required: 'Address is required',
                                maxLength: { value: 500, message: 'Max 500 characters' }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-livey-primary focus:border-transparent resize-none"
                            placeholder="Ex: Alger, Bab El Oued, Rue xyz, Bt 5, Apt 12"
                        />
                        {errors.customer_address && (
                            <p className="mt-1 text-xs text-red-600">{errors.customer_address.message}</p>
                        )}
                    </div>

                    {/* Quantity */}
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    if (watchedQuantity > 1) setValue('quantity', watchedQuantity - 1);
                                }}
                                className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                            </button>
                            <input
                                id="quantity"
                                type="number"
                                min={1}
                                max={99}
                                {...register('quantity', {
                                    valueAsNumber: true,
                                    min: { value: 1, message: 'Minimum 1' },
                                    max: { value: 99, message: 'Maximum 99' }
                                })}
                                className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-livey-primary focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (watchedQuantity < 99) setValue('quantity', watchedQuantity + 1);
                                }}
                                className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                        {errors.quantity && (
                            <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>
                        )}
                    </div>

                    {/* Total and Submit */}
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total</span>
                            <span className="text-xl font-bold text-livey-primary">{formatPrice(total)}</span>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-livey-primary text-white font-bold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                'Confirm Order'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default OrderForm;

import React from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, BadgeMinus, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';

const OrderStats = ({ orders, setStatusFilter }) => {
  const stats = React.useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
    // const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const onHoldOrders = orders.filter(order => order.status === 'on-hold').length;
    const processingOrders = orders.filter(order => order.status === 'processing').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const refundedOrders = orders.filter(o => o.status === 'refunded').length;
    
    const currencies = [...new Set(orders.map(o => o.currency))];
    const revenueString = currencies.length === 1 && currencies[0]
      ? totalRevenue.toLocaleString('en-US', { style: 'currency', currency: currencies[0], minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : `${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 💸`;
    
    return {
      totalOrders,
      revenueString,
      // pendingOrders,
      onHoldOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      refundedOrders
    };
  }, [orders]);
  
  const statCards = [
    { title: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    /*{ title: 'Total Revenue', value: revenueString, icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-50' },*/
    /*{ title: 'Pending', value: pendingOrders.toLocaleString(), icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },*/
    { title: 'Out for Delivery', value: stats.onHoldOrders.toLocaleString(), icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { title: 'Processing', value: stats.processingOrders.toLocaleString(), icon: Package, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { title: 'Completed', value: stats.completedOrders.toLocaleString(), icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Cancelled', value: stats.cancelledOrders.toLocaleString(), icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
    { title: 'Refunded', value: stats.refundedOrders.toLocaleString(), icon: BadgeMinus, color: 'text-purple-600', bgColor: 'bg-purple-50' }
  ];
  // above code is to auto recalculate every time when order array change
  
  /*const [statCards, setStatCards] = React.useState([]);
  useEffect(() => {
    if (!statCards?.length && orders.length > 0) {
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const onHoldOrders = orders.filter(o => o.status === 'on-hold').length;
      const processingOrders = orders.filter(o => o.status === 'processing').length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
      const refundedOrders = orders.filter(o => o.status === 'refunded').length;
      
      const currencies = [...new Set(orders.map(o => o.currency))];
      const revenueString = currencies.length === 1 && currencies[0]
        ? totalRevenue.toLocaleString('en-US', { style: 'currency', currency: currencies[0], minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : `${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 💸`;
      
      setStatCards([
        { title: 'Total Orders', value: totalOrders.toLocaleString(), icon: ShoppingCart, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        /!*{ title: 'Total Revenue', value: revenueString, icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-50' },*!/
        /!*{ title: 'Pending', value: pendingOrders.toLocaleString(), icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },*!/
        { title: 'Out for Delivery', value: onHoldOrders.toLocaleString(), icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
        { title: 'Processing', value: processingOrders.toLocaleString(), icon: Package, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
        { title: 'Completed', value: completedOrders.toLocaleString(), icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
        { title: 'Cancelled', value: cancelledOrders.toLocaleString(), icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
        { title: 'Refunded', value: refundedOrders.toLocaleString(), icon: BadgeMinus, color: 'text-purple-600', bgColor: 'bg-purple-50' }
      ]);
    }
  }, [orders, statCards]);
  */
  
  const handleStatsClick = ((stat) => {
    // picked from FilterControls.jsx
    const orderStatuses = [
      { value: 'all', label: 'All Statuses' },
      { value: 'pending', label: 'Pending' },
      { value: 'processing', label: 'Processing' },
      { value: 'on-hold', label: 'Out for Delivery' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'refunded', label: 'Refunded' },
      { value: 'failed', label: 'Failed' },
    ];
    
    const match = orderStatuses.find(
      (s) => s.label.toLowerCase() === stat.title.toLowerCase()
    );
    if (match) {
      setStatusFilter(match.value); // set by value (e.g., "completed")
    } else {
      setStatusFilter('all');
      console.warn(`No matched for "${stat.title}", setting default as all..`);
    }
  })
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          onClick={() => handleStatsClick(stat)}
        >
          <Card className="p-4 hover:shadow-md transition-shadow h-full cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 truncate">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default OrderStats;
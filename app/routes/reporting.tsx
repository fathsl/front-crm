import {
  BarChart3,
  Cpu,
  FilterIcon,
  Globe,
  MapPin,
  Package,
  Phone,
  Search,
  ShoppingCart,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import type { FilteredOrderDto, OrderFilterDto, ReportingData } from "~/help";
import { json } from "@remix-run/node";
export async function loader({
  request,
}: LoaderFunctionArgs): Promise<Response> {
  const baseUrl =
    process.env.API_BASE_URL || "https://api-crm-tegd.onrender.com";

  const emptyData: ReportingData = {
    productCategories: [],
    components: [],
    customerPurchases: [],
    countryDeliveries: [],
    regionDeliveries: [],
    customers: [],
    orders: [],
    filterOptions: null,
  };

  try {
    const [
      productCategoriesRes,
      componentsRes,
      customerPurchasesRes,
      countryDeliveriesRes,
      regionDeliveriesRes,
      customersRes,
      ordersRes,
      filterOptionsRes,
    ] = await Promise.all([
      fetch(`${baseUrl}/api/reporting/product-categories`),
      fetch(`${baseUrl}/api/reporting/components`),
      fetch(`${baseUrl}/api/reporting/customer-purchases`),
      fetch(`${baseUrl}/api/reporting/country-deliveries`),
      fetch(`${baseUrl}/api/reporting/region-deliveries`),
      fetch(`${baseUrl}/api/reporting/customers`),
      fetch(`${baseUrl}/api/reporting/orders`),
      fetch(`${baseUrl}/api/reporting/filter-options`),
    ]);

    if (
      !productCategoriesRes.ok ||
      !componentsRes.ok ||
      !customerPurchasesRes.ok ||
      !countryDeliveriesRes.ok ||
      !regionDeliveriesRes.ok ||
      !customersRes.ok ||
      !ordersRes.ok ||
      !filterOptionsRes.ok
    ) {
      console.error("One or more API requests failed");
      return json(emptyData);
    }

    const data: ReportingData = {
      productCategories: await productCategoriesRes.json(),
      components: await componentsRes.json(),
      customerPurchases: await customerPurchasesRes.json(),
      countryDeliveries: await countryDeliveriesRes.json(),
      regionDeliveries: await regionDeliveriesRes.json(),
      customers: await customersRes.json(),
      orders: await ordersRes.json(),
      filterOptions: await filterOptionsRes.json(),
    };

    return json(data);
  } catch (error) {
    console.error("Error fetching reporting data:", error);
    return json({ ...emptyData, filterOptions: null });
  }
}

export default function Reporting() {
  const { t } = useTranslation();
  const data = useLoaderData<ReportingData>();
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<OrderFilterDto>({});
  const [filterOrders, setFilterOrders] = useState<FilteredOrderDto[]>(
    data?.filterOptions?.orders || []
  );

  const sections = [
    { id: "overview", name: "Overview", icon: BarChart3 },
    { id: "products", name: "Product Categories", icon: Package },
    { id: "components", name: "Components", icon: Package },
    { id: "customers", name: "Customers", icon: Users },
    { id: "purchases", name: "Customer Purchases", icon: ShoppingCart },
    { id: "deliveries", name: "Deliveries", icon: Globe },
    { id: "orders", name: "Orders", icon: TrendingUp },
  ];

  const filteredCustomers = data?.customers.filter(
    (customer) =>
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.countryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = data?.orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const applyFilters = async () => {
    try {
      const response = await fetch(
        `${process.env.API_BASE_URL}/api/reporting/orders/filter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(filters),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setFilterOrders(result);
      } else {
        console.error("Failed to filter orders");
      }
    } catch (error) {
      console.error("Error filtering orders:", error);
    }
  };

  const resetFilters = () => {
    setFilters({});
    setFilterOrders(data?.filterOptions?.orders || []);
    setShowFilters(false);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
              CRM Dashboard
            </h1>
            <p className="mt-1 text-xs text-gray-600 sm:text-sm">
              Comprehensive analytics for your business
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="mb-4 sm:mb-6">
            <div className="sm:hidden">
              <select
                onChange={(e) => setActiveSection(e.target.value)}
                value={activeSection}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden sm:flex flex-wrap gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeSection === section.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{section.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {(activeSection === "customers" || activeSection === "orders") && (
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={`Search ${activeSection}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          )}

          {activeSection === "overview" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Total Categories",
                  value: data?.productCategories.length,
                  icon: Package,
                  color: "blue",
                },
                {
                  title: "Components",
                  value: data?.components.length,
                  icon: Package,
                  color: "green",
                },
                {
                  title: "Total Customers",
                  value: data?.customers.length,
                  icon: Users,
                  color: "purple",
                },
                {
                  title: "Total Orders",
                  value: data?.orders.length,
                  icon: TrendingUp,
                  color: "orange",
                },
              ].map((card, index) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600 sm:text-sm">
                        {card.title}
                      </p>
                      <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                        {card.value}
                      </p>
                    </div>
                    <card.icon className={`w-6 h-6 text-${card.color}-500`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "products" && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 px-1">
                Product Categories
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data?.productCategories.map((category, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {category.categoryName}
                        </h4>
                        <div className="mt-2 flex items-center">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              category.stock > 100
                                ? "bg-green-100 text-green-800"
                                : category.stock > 50
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            Stock: {category.stock}
                          </span>
                        </div>
                      </div>
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "components" && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 px-1">
                Components
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data?.components.map((component) => (
                  <div
                    key={component.componentId}
                    className="bg-white rounded-lg shadow-sm p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {component.componentName}
                        </h4>
                        <div className="mt-1 text-xs text-gray-500">
                          ID: #{component.componentId}
                        </div>
                        <div className="mt-2 flex items-center">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              component.stock > 100
                                ? "bg-green-100 text-green-800"
                                : component.stock > 50
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            Stock: {component.stock}
                          </span>
                        </div>
                      </div>
                      <Cpu className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "customers" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-lg font-medium text-gray-900">Customers</h3>
                <span className="text-sm text-gray-500">
                  {filteredCustomers.length} total
                </span>
              </div>
              <div className="space-y-3">
                {filteredCustomers.map((customer, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm p-4"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {customer.customerName}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {customer.email}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <Phone className="h-3 w-3 mr-1" /> {customer.phone}
                          </span>
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <Globe className="h-3 w-3 mr-1" />{" "}
                            {customer.countryName}
                          </span>
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />{" "}
                            {customer.region}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "purchases" && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 px-1">
                Customer Purchases
              </h3>
              <div className="space-y-3">
                {data.customerPurchases.map((purchase, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : index === 1
                              ? "bg-gray-100 text-gray-800"
                              : index === 2
                                ? "bg-orange-100 text-orange-800"
                                : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {purchase.customerName}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-semibold text-blue-600">
                        {purchase.totalQuantity.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </div>
            </div>
          )}

          {activeSection === "deliveries" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 px-1">
                  Country Deliveries
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data?.countryDeliveries.map((delivery, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-sm p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-5 w-5 text-gray-400" />
                          <h4 className="font-medium text-gray-900">
                            {delivery.countryName}
                          </h4>
                        </div>
                        <span className="font-semibold text-green-600 text-sm">
                          {delivery.totalQuantity.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 px-1">
                  Region Deliveries
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data?.regionDeliveries.map((delivery, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-sm p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-5 w-5 text-gray-400" />
                          <h4 className="font-medium text-gray-900">
                            {delivery.region}
                          </h4>
                        </div>
                        <span className="font-semibold text-purple-600 text-sm">
                          {delivery.totalQuantity.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "orders" && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-lg font-medium text-gray-900">Orders</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {filteredOrders.length} total
                  </span>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FilterIcon className="h-4 w-4 mr-1" />
                    Filters
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Order Number
                      </label>
                      <input
                        type="text"
                        value={filters.orderNumber || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            orderNumber: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={filters.customerName || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            customerName: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <select
                        value={filters.country || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            country: e.target.value || undefined,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">All Countries</option>
                        {data?.filterOptions?.countries?.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Payment Status
                      </label>
                      <select
                        value={filters.paymentStatus || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            paymentStatus: e.target.value || undefined,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">All Statuses</option>
                        {data?.filterOptions?.paymentStatuses?.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Process Status
                      </label>
                      <select
                        value={filters.processStatus || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            processStatus: e.target.value || undefined,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">All Statuses</option>
                        {data?.filterOptions?.processStatuses?.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Delivery Date Range
                      </label>
                      <div className="mt-1 flex flex-col sm:flex-row gap-2">
                        <input
                          type="date"
                          value={
                            filters.deliveryDateStart
                              ?.toISOString()
                              .split("T")[0] || ""
                          }
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              deliveryDateStart: e.target.value
                                ? new Date(e.target.value)
                                : undefined,
                            })
                          }
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <span className="self-center text-gray-500">to</span>
                        <input
                          type="date"
                          value={
                            filters.deliveryDateEnd
                              ?.toISOString()
                              .split("T")[0] || ""
                          }
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              deliveryDateEnd: e.target.value
                                ? new Date(e.target.value)
                                : undefined,
                            })
                          }
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Reset
                    </button>
                    <button
                      onClick={applyFilters}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {filterOrders.map((order) => (
                  <div
                    key={order.number}
                    className="bg-white rounded-lg shadow-sm p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Order #{order.number}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.customerName}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              order.paymentStatus === "Ödendi"
                                ? "bg-green-100 text-green-800"
                                : order.paymentStatus === "Kısmi Ödendi"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                          <span className="text-xs text-gray-500">
                            {order.stage}
                          </span>
                          <span className="text-xs text-gray-500">
                            {order.orderDate?.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {order.totalPrice.toLocaleString()}{" "}
                          {order.currencyType}
                        </div>
                        <div className="text-xs text-gray-500">
                          Balance: {order.remainingBalance.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.country}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

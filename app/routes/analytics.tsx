import { useTranslation } from 'react-i18next';

export default function Analytics() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            {t('sidebar.analytics')}
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            <p>View detailed analytics and insights about your application.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Performance Metrics
        </h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Page Views</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">45,678</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Unique Visitors</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">12,345</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Bounce Rate</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">23.4%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

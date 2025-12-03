import type { Route } from "./+types/home";
import { useTranslation } from "react-i18next";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MyApp - Home" },
    { name: "description", content: "Welcome to MyApp!" },
  ];
}

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("common.welcome")}
          </h1>
          <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            <p>
              This is your home page with a beautiful layout including navbar
              and sidebar navigation.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t("sidebar.overview")}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get a quick overview of your application metrics and status.
            </p>
            <div className="mt-3">
              <a
                href="/dashboard"
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 text-sm font-medium"
              >
                View Dashboard →
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t("sidebar.analytics")}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Analyze your data with detailed charts and insights.
            </p>
            <div className="mt-3">
              <a
                href="/analytics"
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 text-sm font-medium"
              >
                View Analytics →
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t("sidebar.users")}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage users and their permissions across your application.
            </p>
            <div className="mt-3">
              <a
                href="/users"
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 text-sm font-medium"
              >
                Manage Users →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

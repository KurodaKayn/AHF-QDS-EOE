import React from "react";

interface SettingItemProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingItem({
  title,
  description,
  children,
  className = "",
}: SettingItemProps) {
  return (
    <div
      className={`py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center ${className}`}
    >
      <div className="flex-1 pr-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

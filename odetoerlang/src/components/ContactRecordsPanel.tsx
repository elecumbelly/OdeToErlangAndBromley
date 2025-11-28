/**
 * Contact Records Panel - View and export detailed contact journey data
 */

import { type ContactRecord } from '../simulation/types';

interface ContactRecordsPanelProps {
  records: ContactRecord[];
  onExportCSV: () => void;
}

export default function ContactRecordsPanel({ records, onExportCSV }: ContactRecordsPanelProps) {
  if (records.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Records</h3>
        <div className="text-gray-400 text-sm italic text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          No contact records yet. Start the simulation to collect data.
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const avgQueueWait = records.reduce((sum, r) => sum + r.queueWaitTime, 0) / records.length;
  const avgServiceTime = records.reduce((sum, r) => sum + r.serviceTime, 0) / records.length;
  const avgTotalTime = records.reduce((sum, r) => sum + r.totalTimeInSystem, 0) / records.length;
  const queuedCount = records.filter(r => r.wasQueued).length;
  const queuedPercent = (queuedCount / records.length) * 100;

  // Latest 10 records for display
  const recentRecords = records.slice(-10).reverse();

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Contact Records Summary</h3>
          <button
            onClick={onExportCSV}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV ({records.length} records)</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs font-medium text-blue-700 mb-1">Total Contacts</div>
            <div className="text-2xl font-bold text-blue-900">{records.length}</div>
          </div>
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-xs font-medium text-purple-700 mb-1">Avg Queue Wait</div>
            <div className="text-2xl font-bold text-purple-900">{avgQueueWait.toFixed(2)}</div>
            <div className="text-xs text-purple-600">time units</div>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-xs font-medium text-green-700 mb-1">Avg Service Time</div>
            <div className="text-2xl font-bold text-green-900">{avgServiceTime.toFixed(2)}</div>
            <div className="text-xs text-green-600">time units</div>
          </div>
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-xs font-medium text-orange-700 mb-1">Avg Total Time</div>
            <div className="text-2xl font-bold text-orange-900">{avgTotalTime.toFixed(2)}</div>
            <div className="text-xs text-orange-600">time units</div>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="text-xs font-medium text-indigo-700 mb-1">Queued</div>
            <div className="text-2xl font-bold text-indigo-900">{queuedPercent.toFixed(1)}%</div>
            <div className="text-xs text-indigo-600">{queuedCount} contacts</div>
          </div>
        </div>
      </div>

      {/* Recent Records Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Contacts (last 10)</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arrival
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Queue Wait
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Time
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Time
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Server
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Queued?
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentRecords.map((record) => (
                <tr key={record.customerId} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{record.customerId}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                    {record.arrivalTime.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                    {record.queueWaitTime.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                    {record.serviceTime.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                    {record.totalTimeInSystem.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                    S{record.serverId + 1}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {record.wasQueued ? (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length > 10 && (
          <div className="mt-3 text-sm text-gray-500 text-center">
            Showing 10 of {records.length} total records. Export CSV to see all.
          </div>
        )}
      </div>
    </div>
  );
}

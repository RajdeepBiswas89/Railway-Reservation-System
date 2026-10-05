import React, { useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { Users, Search, Shield, CheckCircle2 } from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');

  const usersList = [
    { id: 'usr-1', name: 'Rajdeep Biswas', email: 'rajdeepbiswas403@gmail.com', phone: '+91 98300 24190', role: 'USER', trips: 12, status: 'VERIFIED' },
    { id: 'usr-2', name: 'Ananya Roy', email: 'ananya.roy@example.com', phone: '+91 98311 90283', role: 'USER', trips: 6, status: 'VERIFIED' },
    { id: 'usr-3', name: 'Siddharth Sen', email: 'siddharth@example.com', phone: '+91 98322 84910', role: 'USER', trips: 4, status: 'VERIFIED' },
    { id: 'usr-4', name: 'Central Ops Controller', email: 'admin@railnex.in', phone: '+91 11 2334 0000', role: 'ADMIN', trips: 0, status: 'ADMIN' },
    { id: 'usr-5', name: 'Priya Sharma', email: 'priya.s@example.com', phone: '+91 98401 23456', role: 'USER', trips: 18, status: 'VERIFIED' },
  ];

  const filtered = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            User Account & KYC Management
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Registered passenger accounts, verified Aadhaar credentials, and role privileges.
          </p>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 flex items-center justify-between text-xs">
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full bg-neutral-50 text-xs rounded-lg border border-neutral-200 pl-8 pr-3 py-1.5 focus:outline-none focus:border-neutral-900 focus:bg-white"
          />
        </div>
        <span className="text-neutral-500 font-mono">{filtered.length} registered accounts</span>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-neutral-50 text-neutral-600 font-semibold text-[10px] uppercase border-b border-neutral-200">
            <tr>
              <th className="p-3.5">User</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Phone</th>
              <th className="p-3.5">Completed Trips</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">KYC Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-neutral-50/70">
                <td className="p-3.5 font-bold text-neutral-900">{u.name}</td>
                <td className="p-3.5 text-neutral-700 font-mono">{u.email}</td>
                <td className="p-3.5 text-neutral-600 font-mono">{u.phone}</td>
                <td className="p-3.5 font-mono font-bold text-neutral-900">{u.trips}</td>
                <td className="p-3.5">
                  <Badge variant={u.role === 'ADMIN' ? 'accent' : 'neutral'} styleType="subtle" showDot={false}>
                    {u.role}
                  </Badge>
                </td>
                <td className="p-3.5">
                  <Badge variant="success" styleType="subtle" showDot>
                    {u.status}
                  </Badge>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => showToast(`User ${u.name} account details verified.`)}
                    className="text-neutral-600 hover:text-neutral-900 font-semibold"
                  >
                    View History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

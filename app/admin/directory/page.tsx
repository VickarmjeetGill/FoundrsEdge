"use client";

import { useState } from "react";

type DirectoryItem = {
  id: number;
  businessName: string;
  ownerName: string;
  category: string;
  status: "Pending" | "Approved";
  featured: boolean;
};

const initialDirectoryItems: DirectoryItem[] = [
  {
    id: 1,
    businessName: "BrightTech Solutions",
    ownerName: "Sarah Johnson",
    category: "Technology",
    status: "Pending",
    featured: false,
  },
  {
    id: 2,
    businessName: "Green Leaf Cafe",
    ownerName: "Michael Lee",
    category: "Food & Beverage",
    status: "Approved",
    featured: true,
  },
  {
    id: 3,
    businessName: "Urban Style Studio",
    ownerName: "Amanda Brown",
    category: "Retail",
    status: "Pending",
    featured: false,
  },
];

export default function AdminDirectoryPage() {
  const [directoryItems, setDirectoryItems] = useState(initialDirectoryItems);

  function handleApprove(id: number) {
    setDirectoryItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, status: "Approved" } : item
      )
    );
  }

  function handleFeature(id: number) {
    setDirectoryItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, featured: !item.featured } : item
      )
    );
  }

  function handleRemove(id: number) {
    const confirmRemove = window.confirm(
      "Are you sure you want to remove this directory listing?"
    );

    if (!confirmRemove) return;

    setDirectoryItems((items) => items.filter((item) => item.id !== id));
  }

  function handleEdit(item: DirectoryItem) {
    alert(`Edit feature selected for ${item.businessName}`);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Directory Management
          </h1>
          <p className="mt-2 text-gray-600">
            Review, approve, feature, edit, or remove business directory
            listings.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Business Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Owner
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Featured
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {directoryItems.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {item.businessName}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.ownerName}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.category}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.featured ? "Yes" : "No"}
                  </td>
                  <td className="space-x-2 px-4 py-4 text-sm">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => handleEdit(item)}
                      className="rounded bg-gray-600 px-3 py-1 text-white hover:bg-gray-700"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleFeature(item.id)}
                      className="rounded bg-purple-600 px-3 py-1 text-white hover:bg-purple-700"
                    >
                      {item.featured ? "Unfeature" : "Feature"}
                    </button>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {directoryItems.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No directory listings available.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Role {
    id: number;
    name: string;
    permissions: string[];
    created_at: string;
    updated_at: string;
}

interface EditRoleModalProps {
    role: Role | null;
    permissions: string[];
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    translations: Record<string, any>;
}

export default function EditRoleModal({ translations, role, onClose, onSuccess, isOpen, permissions } : EditRoleModalProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState({
        name: '',
        permissions: [] as string[]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (role) {
            setFormData({
                name: role.name,
                permissions: Array.isArray(role.permissions) ? role.permissions : []
            });
        } else {
            setFormData({
                name: '',
                permissions: []
            });
        }
    }, [isOpen, role]);

    const groupedPermissions = useMemo(() => {
        return permissions.reduce((acc, perm) => {
            const parts = perm.split('_');
            const resource = parts[parts.length - 1];
            if (!acc[resource]) acc[resource] = [];
            acc[resource].push(perm);
            return acc;
        }, {} as Record<string, string[]>);
    }, [permissions]);

    const togglePermission = (permission: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission]
        }));
    };

    const toggleGroupPermissions = (resource: string, groupPermissions: string[]) => {
        const allChecked = groupPermissions.every(perm => formData.permissions.includes(perm));

        setFormData(prev => ({
            ...prev,
            permissions: allChecked
                ? prev.permissions.filter(p => !groupPermissions.includes(p))
                : [...new Set([...prev.permissions, ...groupPermissions])]
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (role) {
                await axios.put(`/api/roles/${role.id}`, formData);
                toast.success(translations.role.system_update_success);
            } else {
                await axios.post('/api/roles', formData);
                toast.success(translations.role.system_create_success);
            }
            onSuccess();
            window.location.reload();
        } catch (error: any) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                toast.error(role ? translations.role.system_update_missing : translations.role.system_create_missing);
            } else {
                toast.error(role ? translations.role.system_update_error : translations.role.system_create_error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-gray-800/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto text-gray-900">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-gray-800">
                                {role ? translations.role.form_update : translations.role.form_create}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Role Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {translations.role.form_name} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder={translations.role.form_name_placeholder}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>

                            {/* Permissions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {translations.role.form_permissions}
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(groupedPermissions).map(([resource, perms]) => (
                                        <div key={resource} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center mb-3">
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={perms.every(p => formData.permissions.includes(p))}
                                                        onChange={() => toggleGroupPermissions(resource, perms)}
                                                        className="rounded border-gray-300 text-lime-600 focus:ring-lime-500"
                                                    />
                                                    <span className="font-semibold text-gray-800 capitalize">{translations.permissions?.[resource] || resource}</span>
                                                </label>
                                            </div>
                                            <div className="space-y-2 ml-6">
                                                {perms.map((perm) => (
                                                    <label key={perm} className="flex items-center space-x-2 text-sm cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.permissions.includes(perm)}
                                                            onChange={() => togglePermission(perm)}
                                                            className="rounded border-gray-300 text-lime-600 focus:ring-lime-500"
                                                        />
                                                        <span className="text-gray-700 group-hover:text-gray-900">
                                                            {translations.permissions?.[perm] || perm}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {errors.permissions && (
                                    <p className="mt-1 text-sm text-red-500">{errors.permissions}</p>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="px-4 py-2"
                                >
                                    {translations.role.form_cancel}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-lime-500 hover:bg-lime-600 text-white px-4 py-2 rounded-md transition-colors"
                                >
                                    {isSubmitting
                                        ? (role ? translations.role.form_updating : translations.role.form_creating)
                                        : (role ? translations.role.form_update : translations.role.form_create)
                                    }
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
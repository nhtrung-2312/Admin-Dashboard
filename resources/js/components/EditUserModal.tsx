// resources/js/components/EditUserModal.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import axios from 'axios';
import { toast } from 'react-toastify';

interface EditUserModalProps {
    user: User;
    roles: string[];
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    translations: Record<string, any>;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ 
    user, 
    roles,
    isOpen, 
    onClose, 
    onSuccess,
    translations 
}) => {
    const [editFormData, setEditFormData] = useState({
        name: user.name,
        email: user.email,
        is_active: user.is_active ? 1 : 0,
        group_role: user.group_role
    });
    
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.put(`/api/users/${user.id}`, editFormData);
            toast.success(translations.user.system_update_success);
            onSuccess();
            onClose();
        } catch (error: any) {
            if (error.response?.status === 422) {
                setEditErrors(error.response.data.errors || {});
                toast.error(translations.user.system_update_missing);
            } else {
                toast.error(translations.user.system_update_error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-800/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto text-gray-900">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{translations.user.update_title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {translations.user.update_name} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md ${
                                editErrors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {editErrors.name && (
                            <p className="mt-1 text-sm text-red-500">{editErrors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {translations.user.update_email} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md ${
                                editErrors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {editErrors.email && (
                            <p className="mt-1 text-sm text-red-500">{editErrors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {translations.user.update_status} <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="is_active"
                            value={editFormData.is_active}
                            onChange={(e) => setEditFormData({ ...editFormData, is_active: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-md border-gray-300"
                        >
                            <option value={1}>{translations.user.update_status_placeholder_active}</option>
                            <option value={0}>{translations.user.update_status_placeholder_inactive}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {translations.user.update_group} <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="group_role"
                            value={editFormData.group_role}
                            onChange={(e) => setEditFormData({ ...editFormData, group_role: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md border-gray-300"
                        >
                            {roles.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            type="button"
                            className="bg-gray-500 hover:bg-gray-600 text-white"
                            onClick={onClose}
                        >
                            {translations.user.update_button_cancel}
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang cập nhật...' : translations.user.update_button_accept}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, UserCircleIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || ''
    }
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, watch: watchPassword, reset: resetPassword } = useForm();

  const newPassword = watchPassword('newPassword');

  const onSubmitProfile = async (data) => {
    setIsUpdating(true);
    const result = await updateProfile(data);
    if (result.success) {
      toast.success('Profile updated successfully');
    }
    setIsUpdating(false);
  };

  const onSubmitPassword = async (data) => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Password changed successfully');
        resetPassword();
        setShowChangePassword(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error changing password');
      }
    } catch (error) {
      toast.error('Error changing password');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <UserCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
                Personal Information
              </h3>
            </div>
            
            <form onSubmit={handleSubmit(onSubmitProfile)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters'
                      }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters'
                      }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 mt-1">Email address cannot be changed.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  value={user.role}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed capitalize"
                />
                <p className="text-sm text-gray-500 mt-1">Role is managed by administrators.</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full md:w-auto bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white shadow rounded-lg mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Change Password
                </h3>
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {showChangePassword ? 'Cancel' : 'Change Password'}
                </button>
              </div>
            </div>
            
            {showChangePassword && (
              <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      {...registerPassword('currentPassword', {
                        required: 'Current password is required'
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-red-600 mt-1">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      {...registerPassword('newPassword', {
                        required: 'New password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                        }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-600 mt-1">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    {...registerPassword('confirmPassword', {
                      required: 'Please confirm your new password',
                      validate: value =>
                        value === newPassword || 'The passwords do not match'
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="w-full md:w-auto bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Organization Information */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-400" />
                Organization
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <p className="text-sm text-gray-900">{user.organization?.name || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <p className="text-sm text-gray-900">{user.organization?.industry || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Size
                </label>
                <p className="text-sm text-gray-900 capitalize">{user.organization?.size || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>

              {user.lastLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Login
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(user.lastLogin).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white shadow rounded-lg mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Account Status</h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-3 w-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Active</p>
                  <p className="text-sm text-gray-500">Your account is in good standing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
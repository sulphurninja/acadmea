import { usePermissionStatus, canView, canAdd, canEdit, canDelete, hasFeature } from '@/contexts/permissionsContext';

export function usePermissions() {
  const { isLoading, initialized } = usePermissionStatus();
  
  return {
    isLoading,
    isInitialized: initialized,
    canView,
    canAdd,
    canEdit,
    canDelete,
    hasFeature
  };
}
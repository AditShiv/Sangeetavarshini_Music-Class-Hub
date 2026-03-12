import { useQueryClient } from "@tanstack/react-query";
import {
  useListStudents,
  useCreateStudent,
  useDeleteStudent,
  getListStudentsQueryKey
} from "@workspace/api-client-react";

export function useAppStudents() {
  const queryClient = useQueryClient();
  const queryKey = getListStudentsQueryKey();

  const { data: students = [], isLoading } = useListStudents();

  const createMutation = useCreateStudent({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey })
    }
  });

  const deleteMutation = useDeleteStudent({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey })
    }
  });

  return {
    students,
    isLoading,
    createStudent: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteStudent: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

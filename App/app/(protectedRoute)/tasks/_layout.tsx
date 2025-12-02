import { Stack } from 'expo-router';

export default function TasksLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="add-task" />
      <Stack.Screen name="client/[id]" />
      <Stack.Screen name="project-tasks/[projectType]" />
      <Stack.Screen name="task-detail/[taskId]" />
    </Stack>
  );
}
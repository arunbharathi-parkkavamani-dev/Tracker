import FormRenderer from "../../components/Common/FormRenderer";
import { useAuth } from "../../context/authProvider";
import axiosInstance from "../../api/axiosInstance";
import { MdClose } from "react-icons/md";

const CreateTaskModal = ({ onClose, onCreated, selectedClient }) => {
  const { user } = useAuth();

  const taskFormFields = [
    { name: 'title', label: 'Title', type: 'text', placeholder: 'Enter task title', gridClass: 'col-span-2' },
    { name: 'url', label: 'URL', type: 'url', placeholder: 'Related URL', gridClass: 'col-span-2' },
    { name: 'checklist', label: 'Checklist', type: 'SubForm', multiple: true, gridClass: 'col-span-2',
      subFormFields: [
        { name: 'item', label: 'Checklist Item', type: 'text', placeholder: 'Enter checklist item' },
        { name: 'completed', label: 'Completed', type: 'checkbox' }
      ]
    },
    { name: 'userStory', label: 'User Story', type: 'textarea', placeholder: 'As a user, I want...', rows: 4, gridClass: 'col-span-2' },
    { name: 'impactAnalysis', label: 'Impact Analysis', type: 'textarea', placeholder: 'Impact analysis...', rows: 3, gridClass: 'col-span-2' },
    { name: 'acceptanceCriteria', label: 'Acceptance Criteria', type: 'textarea', placeholder: 'Define when this task is complete...', rows: 3, gridClass: 'col-span-2' },
    { name: 'startDate', label: 'Start Date', type: 'date', value: new Date().toISOString().split('T')[0] },
    { name: 'dueDate', label: 'Due Date', type: 'date' },
    { name: 'priorityLevel', label: 'Priority', type: 'AutoComplete', source: '', options: [
      { _id: 'Low', name: 'Low' },
      { _id: 'Medium', name: 'Medium' },
      { _id: 'High', name: 'High' },
      { _id: 'Weekly Priority', name: 'Weekly Priority' }
    ]},
    { name: 'projectTypeId', label: 'Product Type', type: 'AutoComplete', source: '/populate/read/projecttypes' },
    { name: 'taskTypeId', label: 'Task Type', type: 'AutoComplete', source: '/populate/read/tasktypes' },
    { name: 'clientId', label: 'Client', type: 'AutoComplete', source: '/populate/read/clients', 
      value: selectedClient ? { _id: selectedClient._id, name: selectedClient.name } : null,
      external: !!selectedClient, externalValue: selectedClient?.name
    },
    { name: 'assignedTo', label: 'Assign To', type: 'AutoComplete', multiple: true, source: '/populate/read/employees', gridClass: 'col-span-2' }
  ];

  const handleCreateTask = async (formData) => {
    try {
      await axiosInstance.post('/populate/create/tasks', {
        ...formData,
        createdBy: user.id,
        status: 'Backlogs'
      });
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Create New Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <MdClose size={24} />
          </button>
        </div>
        <div className="p-6">
          <FormRenderer
            fields={taskFormFields}
            onSubmit={handleCreateTask}
            submitButton={{ text: 'Create Task', color: 'blue' }}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
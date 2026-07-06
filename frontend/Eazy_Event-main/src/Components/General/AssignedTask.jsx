import { useState, useEffect } from 'react';
import apiService from '../../Utils/apiService';
import { Link, useParams } from 'react-router-dom';
import formatDateTime from '../../Utils/FormatDate';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Button from '../UI/Button';
import Dialog from '../UI/Dialog';
import Card from '../UI/Card';

const AssignedTask = () => {
  const { id } = useParams();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasksResponse = await apiService.get(`/api/tasks/user/${id}`);
        setTasks(Array.isArray(tasksResponse) ? tasksResponse : tasksResponse?.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchTasks();
  }, [id]);

  const handleTaskCompletionChange = (task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleDialogClose = (confirmed) => {
    if (confirmed && selectedTask) {
      const updatedTasks = tasks.map((task) =>
        task._id === selectedTask._id ? { ...task, completed: true } : task
      );
      setTasks(updatedTasks);
      apiService.put(`/api/tasks/${selectedTask._id}`, { completed: true })
        .catch((error) => console.error('Error updating task:', error));
    }
    setDialogOpen(false);
    setSelectedTask(null);
  };

  const getTaskBorderStyle = (task) => {
    const now = new Date();
    const deadline = new Date(task.deadline);
    if (task.completed === true) return 'border-l-4 border-l-green-500';
    if (deadline < now) return 'border-l-4 border-l-red-500';
    if (deadline - now < 24 * 60 * 60 * 1000) return 'border-l-4 border-l-yellow-500';
    return 'border-l-4 border-l-gray-200 dark:border-l-gray-600';
  };

  const getTaskWarning = (task) => {
    const now = new Date();
    const deadline = new Date(task.deadline);
    if (task.completed === true) {
      return (<div className="flex items-center text-green-500 text-sm mt-2"><CheckCircle className="w-4 h-4 mr-1" /><span>Completed</span></div>);
    } else if (deadline < now) {
      return (<div className="flex items-center text-red-500 text-sm mt-2"><XCircle className="w-4 h-4 mr-1" /><span>Deadline Passed</span></div>);
    } else if (deadline - now < 24 * 60 * 60 * 1000) {
      return (<div className="flex items-center text-yellow-500 text-sm mt-2"><AlertTriangle className="w-4 h-4 mr-1" /><span>Deadline Approaching</span></div>);
    }
    return null;
  };

  return (
    <section className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">Assigned Tasks</h1>
        <div className="flex flex-col gap-4">
          {tasks.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-20">No tasks assigned</p>
          )}
          {tasks.map((task) => {
            const { dateOnly, timeOnly } = formatDateTime(task.deadline);
            return (
              <div key={task._id} className={`p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 ${getTaskBorderStyle(task)}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center flex-wrap gap-2">
                      {task.title}
                      {task.event && (
                        <Link to={`/events/${task.event._id}`} className="text-blue-600 text-sm font-normal">
                          ({task.event.title})
                        </Link>
                      )}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{task.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Deadline: {dateOnly} {timeOnly}</p>
                    {getTaskWarning(task)}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={task.completed === true}
                      onChange={() => handleTaskCompletionChange(task)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">Done</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => handleDialogClose(false)}
        title="Confirm Task Completion"
        size="sm"
        actions={
          <>
            <Button variant="ghost" onClick={() => handleDialogClose(false)}>Cancel</Button>
            <Button variant="success" onClick={() => handleDialogClose(true)}>Confirm</Button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">
          Mark "<strong className="text-gray-900 dark:text-white">{selectedTask?.title}</strong>" as completed?
        </p>
      </Dialog>
    </section>
  );
};

export default AssignedTask;

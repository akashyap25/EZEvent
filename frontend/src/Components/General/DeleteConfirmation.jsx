import { useState } from 'react';
import PropTypes from 'prop-types';
import { Trash2, Loader } from 'lucide-react';
import Button from '../UI/Button';
import Dialog from '../UI/Dialog';
import deleteEvent from '../../Utils/DeleteEvent';

const DeleteConfirmation = ({ eventId }) => {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleClickOpen = () => { 
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDelete = async () => {
    setIsPending(true);
    try {
      await deleteEvent({ eventId });
      setIsPending(false);
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting event:', error);
      setIsPending(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="danger"
        className="shadow-lg z-10"
        onClick={handleClickOpen}
        icon={Trash2}
      >
        Delete
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        title="Are you sure you want to delete?"
        size="sm"
        actions={
          <>
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">
          This will permanently delete this event. This action cannot be undone.
        </p>
      </Dialog>
    </>
  );
};

DeleteConfirmation.propTypes = {
  eventId: PropTypes.string.isRequired,
};

export default DeleteConfirmation;

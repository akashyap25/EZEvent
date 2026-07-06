import React from 'react';
import { useParams } from 'react-router-dom';
import CreateEvent from './CreateEvent';

/**
 * UpdateEvent — Reuses the CreateEvent wizard in edit mode.
 * Passes the event ID so CreateEvent fetches existing data and uses PUT on submit.
 */
const UpdateEvent = () => {
  const { id } = useParams();
  return <CreateEvent editEventId={id} />;
};

export default UpdateEvent;

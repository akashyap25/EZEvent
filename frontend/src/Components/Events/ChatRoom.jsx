import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical, 
  Users, 
  Settings,
  X,
  Edit3,
  Trash2,
  Reply,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Laugh,
  Angry,
  Frown,
  Star,
  AlertCircle
} from 'lucide-react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../../Utils/Constants';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../UI/Card';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';

const ChatRoom = ({ eventId, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user, accessToken } = useAuth();

  const emojis = [
    { emoji: '❤️', name: 'heart' },
    { emoji: '👍', name: 'thumbs_up' },
    { emoji: '👎', name: 'thumbs_down' },
    { emoji: '😂', name: 'laugh' },
    { emoji: '😢', name: 'frown' },
    { emoji: '😮', name: 'star' },
    { emoji: '😡', name: 'angry' }
  ];

  const socketRef = useRef(null);
  const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || 'Guest' : 'Guest';

  useEffect(() => {
    const token = (accessToken || localStorage.getItem('accessToken') || '').trim();
    if (token) {
      initializeSocket(token);
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
    }
    loadChatRooms();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [eventId, accessToken]);

  useEffect(() => {
    if (currentRoom && !currentRoom.isFallback) {
      loadMessages();
    }
  }, [currentRoom?._id]);

  useEffect(() => {
    if (currentRoom && socket) {
      socket.emit('join_room', { roomId: currentRoom._id, displayName });
    }
  }, [currentRoom, socket, displayName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSocket = (token) => {
    if (!token) return;
    const newSocket = io(SERVER_URL, {
      auth: { token: String(token) },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000
    });
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setError('Failed to connect to chat server');
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message || 'Socket error occurred');
    });

    newSocket.on('new_message', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    newSocket.on('message_edited', (data) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId ? data.message : msg
      ));
    });

    newSocket.on('message_deleted', (data) => {
      setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
    });

    newSocket.on('message_updated', (data) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId ? data.message : msg
      ));
    });

    newSocket.on('reaction_added', (data) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId ? data.message : msg
      ));
    });

    newSocket.on('reaction_removed', (data) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId ? data.message : msg
      ));
    });

    newSocket.on('user_typing', (data) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        return [...filtered, { userId: data.userId, username: data.username }];
      });
    });

    newSocket.on('user_stopped_typing', (data) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    newSocket.on('error', (error) => {
      setError(error.message);
    });

    setSocket(newSocket);
  };

  const loadChatRooms = async () => {
    const eventIdStr = typeof eventId === 'string' ? eventId : (eventId?.$oid ?? eventId?._id ?? eventId?.id ?? '');
    const validEventId = /^[a-fA-F0-9]{24}$/.test(eventIdStr) ? eventIdStr : null;

    function setFallbackRoom() {
      const fallback = { _id: validEventId || eventIdStr || eventId, name: 'Event Chat', description: 'General discussion for this event', isFallback: true };
      setChatRooms([fallback]);
      setCurrentRoom(fallback);
    }

    if (!validEventId) {
      setError('Invalid event ID');
      setFallbackRoom();
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`${SERVER_URL}/api/chat/events/${validEventId}/rooms`, { headers });

      if (response.ok) {
        const data = await response.json();
        const rooms = data.data && Array.isArray(data.data) ? data.data : [];
        if (rooms.length > 0) {
          setChatRooms(rooms);
          setCurrentRoom(rooms[0]);
        } else if (token) {
          const createRes = await fetch(`${SERVER_URL}/api/chat/events/${validEventId}/rooms`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const createData = await createRes.json().catch(() => ({}));
          if (createRes.ok && createData.success && createData.data?._id) {
            const room = createData.data;
            setChatRooms([room]);
            setCurrentRoom(room);
          } else {
            const msg = createData.message || (createData.errors?.length ? createData.errors.map(e => e.message).join(', ') : 'Failed to create or join chat room');
            setError(msg);
            setFallbackRoom();
          }
        } else {
          setFallbackRoom();
        }
      } else {
        setFallbackRoom();
      }
    } catch (error) {
      setError('Failed to load chat rooms');
      setFallbackRoom();
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!currentRoom) return;
    if (currentRoom.isFallback) {
      setMessages([]);
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`${SERVER_URL}/api/chat/rooms/${currentRoom._id}/messages`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data?.data) ? data.data : [];
        setMessages(list);
      } else if (response.status === 401) {
        // User not authenticated, show sample messages for testing
        setMessages([
          {
            _id: '1',
            content: 'Welcome to the event chat!',
            sender: { firstName: 'System', lastName: '' },
            createdAt: new Date().toISOString(),
            messageType: 'text'
          },
          {
            _id: '2',
            content: 'Please log in to send messages.',
            sender: { firstName: 'System', lastName: '' },
            createdAt: new Date().toISOString(),
            messageType: 'text'
          }
        ]);
      }
    } catch (error) {
      setError('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    const activeSocket = socketRef.current || socket;
    if (!newMessage.trim() || !currentRoom || !activeSocket) return;
    if (!user) {
      setError('Please log in to send messages');
      return;
    }
    if (currentRoom.isFallback) {
      setError('Chat room is not ready. Please refresh the page.');
      return;
    }
    try {
      const messageData = {
        roomId: currentRoom._id,
        content: newMessage.trim(),
        replyTo: replyTo?._id
      };
      activeSocket.emit('send_message', messageData);
      setNewMessage('');
      setReplyTo(null);
      socketRef.current?.emit('typing_stop', { roomId: currentRoom._id });
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && currentRoom && socket) {
      socket.emit('typing_start', { roomId: currentRoom._id });
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && currentRoom) {
        socket.emit('typing_stop', { roomId: currentRoom._id });
        setIsTyping(false);
      }
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addReaction = async (messageId, emoji) => {
    if (!socket) return;

    try {
      socket.emit('add_reaction', { messageId, emoji });
    } catch (error) {
      setError('Failed to add reaction');
    }
  };

  const removeReaction = async (messageId, emoji) => {
    if (!socket) return;

    try {
      socket.emit('remove_reaction', { messageId, emoji });
    } catch (error) {
      setError('Failed to remove reaction');
    }
  };

  const editMessage = async (messageId, newContent) => {
    if (!socket) return;

    try {
      socket.emit('edit_message', { messageId, newContent });
      setEditingMessage(null);
    } catch (error) {
      setError('Failed to edit message');
    }
  };

  const deleteMessage = async (messageId) => {
    if (!socket) return;

    try {
      socket.emit('delete_message', { messageId });
    } catch (error) {
      setError('Failed to delete message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMessageSenderName = (message) => {
    if (message.sender && (message.sender.firstName || message.sender.username)) {
      return [message.sender.firstName, message.sender.lastName].filter(Boolean).join(' ').trim() || message.sender.username;
    }
    return message.senderGuestDisplayName || 'Guest';
  };
  const getMessageSenderRoleLabel = (message) => {
    const r = message.senderEventRole;
    if (r === 'owner') return 'Owner';
    if (r === 'collaborator') return 'Collaborator';
    if (r === 'attendee') return 'Attendee';
    return null;
  };
  const isOwnMessage = (message) => message.sender?._id === user?._id;
  const getMessageSenderInitial = (message) => {
    if (message.sender) return message.sender.firstName?.[0] || message.sender.username?.[0] || 'U';
    return (message.senderGuestDisplayName || 'G')[0];
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
        <Card className="p-8 my-8">
          <LoadingSpinner />
          <p className="mt-4 text-center">Loading chat...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Event Chat</h2>
              {currentRoom && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{currentRoom.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              icon={Settings}
            >
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              icon={X}
            >
              Close
            </Button>
          </div>
        </div>

        {/* Chat Rooms Sidebar */}
        {showSettings && (
          <div className="flex-1 flex">
            <div className="w-64 border-r border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Chat Rooms</h3>
              <div className="space-y-2">
                {chatRooms.map(room => (
                  <button
                    key={room._id}
                    onClick={() => setCurrentRoom(room)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentRoom?._id === room._id
                        ? 'bg-blue-100 text-blue-900'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{room.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{room.type}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 flex items-center justify-between gap-2">
            <p className="text-sm text-red-700">{error}</p>
            <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-sm font-medium">Dismiss</button>
          </div>
        )}

        {/* Authentication Notice */}
        {!user && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You're viewing the chat in read-only mode. <a href="/signin" className="font-medium underline text-yellow-700 hover:text-yellow-600">Log in</a> to send messages.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => {
              const showDate = index === 0 || 
                formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);
              
              return (
                <div key={message._id}>
                  {showDate && (
                    <div className="text-center text-sm text-gray-500 my-4">
                      {formatDate(message.createdAt)}
                    </div>
                  )}
                  
                  <div className={`flex gap-3 ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}>
                    {!isOwnMessage(message) && (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {getMessageSenderInitial(message)}
                      </div>
                    )}
                    
                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage(message) ? 'order-first' : ''}`}>
                      <div className={`text-sm font-medium mb-1 flex items-center gap-2 flex-wrap ${isOwnMessage(message) ? 'justify-end' : ''}`}>
                        {!isOwnMessage(message) ? (
                          <>
                            <span className="text-gray-900 dark:text-white">{getMessageSenderName(message)}</span>
                            {getMessageSenderRoleLabel(message) && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                message.senderEventRole === 'owner' ? 'bg-amber-100 text-amber-800' :
                                message.senderEventRole === 'collaborator' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {getMessageSenderRoleLabel(message)}
                              </span>
                            )}
                          </>
                        ) : getMessageSenderRoleLabel(message) ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            message.senderEventRole === 'owner' ? 'bg-amber-100 text-amber-800' :
                            message.senderEventRole === 'collaborator' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {getMessageSenderRoleLabel(message)}
                          </span>
                        ) : null}
                      </div>
                      
                      <div className={`p-3 rounded-lg ${
                        isOwnMessage(message)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        {message.replyTo && (
                          <div className="text-xs opacity-75 mb-2 border-l-2 pl-2">
                            Replying to: {message.replyTo.content}
                          </div>
                        )}
                        
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        
                        {message.isEdited && (
                          <div className="text-xs opacity-75 mt-1">(edited)</div>
                        )}
                        
                        <div className="text-xs opacity-75 mt-1">
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                      
                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(
                            message.reactions.reduce((acc, reaction) => {
                              acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                const userReacted = message.reactions.some(r => 
                                  r.user === user?._id && r.emoji === emoji
                                );
                                if (userReacted) {
                                  removeReaction(message._id, emoji);
                                } else {
                                  addReaction(message._id, emoji);
                                }
                              }}
                              className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded-full transition-colors"
                            >
                              {emoji} {count}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="text-sm text-gray-500 italic">
                {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            {replyTo && (
              <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">Replying to:</span> {replyTo.content}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(null)}
                  icon={X}
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  placeholder={user ? "Type a message..." : "Please log in to send messages"}
                  className={`w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!user ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  rows={1}
                  disabled={!user}
                />
                
                {showEmojiPicker && (
                  <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                    <div className="grid grid-cols-4 gap-1">
                      {emojis.map(emoji => (
                        <button
                          key={emoji.name}
                          onClick={() => {
                            setNewMessage(prev => prev + emoji.emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="p-2 hover:bg-gray-100 rounded transition-colors"
                        >
                          {emoji.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                icon={Smile}
              />
              
              <Button
                variant="primary"
                size="sm"
                onClick={sendMessage}
                disabled={!newMessage.trim() || !user}
                icon={Send}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatRoom;

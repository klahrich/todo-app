"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export default function TodoList({ userId }: { userId: string }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | undefined>(undefined);
  const [tags, setTags] = useState<string>('');

  useEffect(() => {
    console.log("TodoList received userId:", userId);

    if (!userId || typeof userId !== 'string' || userId.length === 0) {
      console.error('Invalid userId provided to TodoList:', userId);
      return;
    }

    console.log("Setting up Firestore listener for userId:", userId);
    const q = query(collection(db, 'todos'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log("Received Firestore update");
      const todosArray: Todo[] = [];
      querySnapshot.forEach((doc) => {
        todosArray.push({ id: doc.id, ...doc.data() } as Todo);
      });
      console.log("Updated todos:", todosArray);
      setTodos(todosArray);
    }, (error) => {
      console.error("Firestore listener error:", error);
    });

    return () => {
      console.log("Unsubscribing from Firestore listener");
      unsubscribe();
    };
  }, [userId]);

  const addTodo = async (e: React.FormEvent) => {
    console.log("addTodo function called");
    e.preventDefault();
    if (newTodo.trim() === '' || !userId) return;

    try {
      const todoData = {
        text: newTodo,
        completed: false,
        userId: userId,
        dueDate: dueDate ? dueDate.toISOString() : null,
        priority: priority || null,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
      };

      const docRef = await addDoc(collection(db, 'todos'), todoData);
      console.log("Todo added with ID:", docRef.id);
      setNewTodo('');
      setDueDate(undefined);
      setPriority(undefined);
      setTags('');
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'todos', todo.id), {
        completed: !todo.completed,
      });
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  const deleteTodo = async (todoId: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'todos', todoId));
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  if (!userId) {
    console.log("TodoList rendering loading state"); // Add this line for debugging
    return <div>Loading...</div>;
  }

  console.log("TodoList rendering with todos:", todos); // Add this line for debugging

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>To-Do List</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={addTodo} className="space-y-4">
          <Input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new todo"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : <span>Pick a due date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add tags (comma-separated)"
          />
          <Button type="submit" className="w-full">Add Todo</Button>
        </form>
        <ul className="space-y-4 mt-4">
          {todos.map((todo) => (
            <Card key={todo.id} className="w-full">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span
                      className={`cursor-pointer ${todo.completed ? 'line-through' : ''}`}
                      onClick={() => toggleTodo(todo)}
                    >
                      {todo.text}
                    </span>
                    <Button variant="destructive" size="sm" onClick={() => deleteTodo(todo.id)}>
                      Delete
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {todo.dueDate && (
                      <span className="mr-2">
                        Due: {format(new Date(todo.dueDate), "MMM d")}
                      </span>
                    )}
                    {todo.priority && (
                      <span className={`${
                        todo.priority === 'high' ? 'text-red-500' :
                        todo.priority === 'medium' ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        Priority: {todo.priority}
                      </span>
                    )}
                  </div>
                  {todo.tags && todo.tags.length > 0 && (
                    <div className="text-sm text-blue-500 mt-1">
                      Tags: {todo.tags.join(', ')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
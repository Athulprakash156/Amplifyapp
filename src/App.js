import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation, updateNote as updateNoteMutation } from './graphql/mutations';
import 'bootstrap/dist/css/bootstrap.min.css';


const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [isUpdate, setUpdate] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
      if(isUpdate){
        if (!formData.name || !formData.description) return;
        console.log("formData",formData)
        await API.graphql({ query: updateNoteMutation, variables: { input: formData } });
        // await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});

    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    fetchNotes();
    setUpdate(false);
    setFormData(initialFormState);
      }
      else{
        if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    // setNotes([ ...notes, formData ]);
    fetchNotes();
    setFormData(initialFormState);
      }
    
  }

  async function updateNote({id,name,description}){
    let request={id, name, description};
    setFormData(request);
    setUpdate(true);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }
  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  return (
    <div className="App">
        <style>{'body { background-color: #85929E ; }'}</style>
        <h1>My Notes App</h1>
        <input
         onChange={e => setFormData({ ...formData, 'name': e.target.value})}
         placeholder="Note name"
         value={formData.name}
        />&nbsp;&nbsp;
        <input
         onChange={e => setFormData({ ...formData, 'description': e.target.value})}
         placeholder="Note description"
         value={formData.description}
       />&nbsp;&nbsp;
       <input
        type="file"
        onChange={onChange}
       />
       <button onClick={createNote}>{isUpdate?"Update Node":"Create Note"}</button>
         <div style={{marginBottom: 30,marginTop:30}}>
           <table>
           <thead>
            <tr>
             <th>Name</th>
             <th>Description</th>
             <th>Pictures</th>
             <th>Actions</th>
           </tr>
          </thead>
         <tbody> 
           {notes.map((note,index) => (
               <tr key={index} className="table-row">
               <td>{ note.name }</td>
               <td>{ note.description}</td>
               <td>{ note.image && <img src={note.image}/>}</td>
               <td><button onClick={() => deleteNote(note)}>Delete note</button>
               <button className="end-button" onClick={() =>updateNote(note)}>Update note</button></td>
              </tr>
           ))}
        </tbody>
        </table>
         </div>   
       <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);
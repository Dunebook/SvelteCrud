<script>
  let notes = [
    {
      id: 1,
      title: "Sweetest framework ever",
      category: "Church",
      content: "This is the content of this note"
    },
    {
      id: 2,
      title: "intro to svelt",
      category: "School",
      content:
        "This could be an intro to svelt,so you need to keep calm and see the magic"
    }
  ];

  let data = {
    title: "",
    category: "",
    content: "",
    id: null
  };

  let addNote = () => {
    const newNote = {
      id: notes.length + 1,
      title: data.title,
      category: data.category,
      content: data.content
    };
    notes = notes.concat(newNote);
    data = {
      id: null,
      title: "",
      category: "",
      content: ""
    };
    console.log(notes);
  };

  let isEdit = false;

  let editNote = note => {
    isEdit = true;
    data = note;
  };

  let updateNote = () => {
    isEdit = !isEdit;
    let noteDB = {
      title: data.title,
      category: data.category,
      content: data.content,
      id: data.id
    };
    let objIndex = notes.findIndex(obj => obj.id == noteDB.id);
    console.log("Before update: ", notes[objIndex]);
    notes[objIndex] = noteDB;
    data = {
      id: null,
      title: "",
      category: "",
      content: ""
    };
  };

  let deleteNote = id => {
    console.log(id);
    notes = notes.filter(note => note.id !== id);
  };
</script>

<style>
  @import url("https://fonts.googleapis.com/css?family=Nunito&display=swap");

  * {
    font-family: "Nunito", sans-serif;
  }
</style>

<section>
  <div class="container">
    <div class="row mt-5 ">
      <div class="col-md-6">
        <div class="card p-2 shadow">
          <div class="card-body">
            <h5 class="card-title mb-4">Add New Note</h5>
            <form>
              <div class="form-group">
                <label for="title">Title</label>
                <input
                  bind:value={data.title}
                  type="text"
                  class="form-control"
                  id="text"
                  placeholder="Note Title" />
              </div>
              <div class="form-group">
                <label for="category">Category</label>
                <select
                  class="form-control"
                  id="category"
                  bind:value={data.category}>
                  <option selected disaabled>Selecet a category</option>
                  <option value="School">School</option>
                  <option value="Church">Church</option>
                  <option value="Home">Home</option>
                </select>
              </div>
              <div class="form-group">
                <label for="content">Content</label>
                <textarea
                  bind:value={data.content}
                  class="form-control"
                  id="content"
                  rows="3"
                  placeholder="Note Content" />
              </div>
              {#if isEdit === false}
                <button
                  type="submit"
                  on:click|preventDefault={addNote}
                  class="btn btn-primary">
                  Add Note
                </button>
              {:else}
                <button
                  type="submit"
                  on:click|preventDefault={updateNote}
                  class="btn btn-info">
                  Edit Note
                </button>
              {/if}
            </form>
          </div>

        </div>
      </div>
      <div class="col-md-6">
        {#each notes as note}
          <div class="card mb-3">

            <div class="card-header">{note.category}</div>
            <div class="card-body">
              <h5 class="card-title">{note.title}</h5>
              <p class="card-text">{note.content}</p>
              <button class="btn btn-info" on:click={editNote(note)}>
                Edit
              </button>

              <button class="btn btn-danger" on:click={deleteNote(note.id)}>
                Delete
              </button>

            </div>

          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

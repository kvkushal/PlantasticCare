document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const postsContainer = document.getElementById("posts-container");
  const newPostForm = document.getElementById("new-post-form");

  // Redirect to login if the user is not logged in
  if (!token) {
    alert("Please log in to create or view posts.");
    window.location.href = "login.html";
    return;
  }

  // Handle Post Creation
  newPostForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("post-title").value;
    const content = document.getElementById("post-content").value;

    if (title && content) {
      try {
        const response = await fetch("http://localhost:5000/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, content }),
        });

        if (response.ok) {
          const newPost = await response.json();
          renderPost(newPost);
          newPostForm.reset();
        } else {
          const error = await response.json();
          alert(error.message);
        }
      } catch (error) {
        console.error("Error creating post:", error);
      }
    } else {
      alert("Please fill in all fields.");
    }
  });

  // Fetch and Display Posts
  async function fetchPosts() {
    try {
      const response = await fetch("http://localhost:5000/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const posts = await response.json();
        posts.forEach((post) => renderPost(post));
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }

  // Render Post in the DOM
  function renderPost(post) {
    const postElement = document.createElement("div");
    postElement.className = "post";
    postElement.innerHTML = `
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <small>Posted by: ${post.author} on ${new Date(post.createdAt).toLocaleString()}</small>
      <div class="vote-buttons">
        <button class="upvote-button">Upvote</button>
        <span class="vote-count">${post.upvotes || 0}</span>
        <button class="downvote-button">Downvote</button>
      </div>
      <div class="comments">
        <h4>Comments</h4>
        <div class="comments-list">
          ${post.comments
            .map(
              (comment) =>
                `<p><strong>${comment.author}:</strong> ${comment.text}</p>`
            )
            .join("")}
        </div>
        <textarea class="comment-input" placeholder="Write a comment"></textarea>
        <button class="comment-button">Post Comment</button>
      </div>
    `;

    const upvoteButton = postElement.querySelector(".upvote-button");
    const downvoteButton = postElement.querySelector(".downvote-button");
    const voteCount = postElement.querySelector(".vote-count");

    // Handle Upvote
    upvoteButton.addEventListener("click", async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/posts/${post._id}/upvote`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const updatedPost = await response.json();
          voteCount.textContent = updatedPost.upvotes;
        } else {
          const error = await response.json();
          alert(error.message);
        }
      } catch (error) {
        console.error("Error upvoting post:", error);
      }
    });

    // Handle Downvote
    downvoteButton.addEventListener("click", async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/posts/${post._id}/downvote`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const updatedPost = await response.json();
          voteCount.textContent = updatedPost.upvotes;
        } else {
          const error = await response.json();
          alert(error.message);
        }
      } catch (error) {
        console.error("Error downvoting post:", error);
      }
    });

    const commentButton = postElement.querySelector(".comment-button");
    commentButton.addEventListener("click", async () => {
      const commentInput = postElement.querySelector(".comment-input");
      const commentText = commentInput.value;

      if (commentText) {
        try {
          const response = await fetch(
            `http://localhost:5000/posts/${post._id}/comments`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ text: commentText }),
            }
          );

          if (response.ok) {
            const newComment = await response.json();
            const commentsList = postElement.querySelector(".comments-list");
            commentsList.innerHTML += `<p><strong>${newComment.author}:</strong> ${newComment.text}</p>`;
            commentInput.value = "";
          } else {
            const error = await response.json();
            alert(error.message);
          }
        } catch (error) {
          console.error("Error posting comment:", error);
        }
      }
    });

    postsContainer.appendChild(postElement);
  }

  // Fetch existing posts on page load
  fetchPosts();
});

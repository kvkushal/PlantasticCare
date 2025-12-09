/**
 * PlantasticCare - Community Forum
 * Secure implementation with XSS protection and proper vote handling
 */

document.addEventListener("DOMContentLoaded", function () {
  const postsContainer = document.getElementById("posts-container");
  const newPostForm = document.getElementById("new-post-form");

  // Check if user is logged in
  if (!API_CONFIG.isLoggedIn()) {
    Toast.warning("Please log in to create or view posts.");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    return;
  }

  // Handle Post Creation
  newPostForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const titleInput = document.getElementById("post-title");
    const contentInput = document.getElementById("post-content");
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
      Toast.warning("Please fill in all fields.");
      return;
    }

    const submitBtn = newPostForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Posting...";

    try {
      const newPost = await API_CONFIG.request('/posts', {
        method: 'POST',
        body: { title, content }
      });

      // Add vote properties for display
      newPost.upvoteCount = 0;
      newPost.downvoteCount = 0;
      newPost.voteScore = 0;
      newPost.hasUpvoted = false;
      newPost.hasDownvoted = false;

      renderPost(newPost, true); // Prepend new post
      newPostForm.reset();
      Toast.success("Post created successfully!");
    } catch (error) {
      Toast.error(error.message || "Failed to create post");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // Fetch and Display Posts
  async function fetchPosts() {
    postsContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #2a7a44;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        "></div>
        <p>Loading posts...</p>
      </div>
    `;

    try {
      const posts = await API_CONFIG.request('/posts', { auth: false });
      postsContainer.innerHTML = '';

      if (posts.length === 0) {
        postsContainer.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #666;">
            <h3 style="color: #2a472e;">No posts yet!</h3>
            <p>Be the first to share something with the community.</p>
          </div>
        `;
        return;
      }

      posts.forEach((post) => renderPost(post));
    } catch (error) {
      postsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #dc3545;">
          <p>Failed to load posts. Please try again later.</p>
          <button onclick="location.reload()" style="
            margin-top: 15px;
            padding: 10px 20px;
            background: #2a7a44;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">Retry</button>
        </div>
      `;
    }
  }

  // Render Post in the DOM (XSS Safe)
  function renderPost(post, prepend = false) {
    const postElement = document.createElement("div");
    postElement.className = "post";
    postElement.dataset.postId = post._id;

    // Calculate vote score
    const voteScore = post.voteScore ?? (post.upvoteCount - post.downvoteCount);

    // Create elements safely (no innerHTML with user content)
    const postHeader = document.createElement("div");
    postHeader.className = "post-header";

    const titleEl = document.createElement("h3");
    titleEl.textContent = post.title; // Safe - uses textContent

    const contentEl = document.createElement("p");
    contentEl.textContent = post.content; // Safe - uses textContent

    const metaEl = document.createElement("small");
    metaEl.textContent = `Posted by ${post.author} on ${new Date(post.createdAt).toLocaleString()}`;

    // Vote buttons container
    const voteDiv = document.createElement("div");
    voteDiv.className = "vote-buttons";
    voteDiv.innerHTML = `
      <button class="upvote-button ${post.hasUpvoted ? 'active' : ''}" title="Upvote">
        <span class="vote-icon">▲</span>
      </button>
      <span class="vote-count">${voteScore}</span>
      <button class="downvote-button ${post.hasDownvoted ? 'active' : ''}" title="Downvote">
        <span class="vote-icon">▼</span>
      </button>
    `;

    // Comments section
    const commentsDiv = document.createElement("div");
    commentsDiv.className = "comments";

    const commentsHeader = document.createElement("h4");
    commentsHeader.textContent = `Comments (${post.comments?.length || 0})`;
    commentsDiv.appendChild(commentsHeader);

    const commentsList = document.createElement("div");
    commentsList.className = "comments-list";

    // Render existing comments safely
    if (post.comments && post.comments.length > 0) {
      post.comments.forEach(comment => {
        const commentEl = document.createElement("div");
        commentEl.className = "comment-item";
        commentEl.style.cssText = "padding: 10px; margin: 5px 0; background: #f8f8f8; border-radius: 5px;";

        const commentAuthor = document.createElement("strong");
        commentAuthor.textContent = comment.author + ": ";

        const commentText = document.createElement("span");
        commentText.textContent = comment.text;

        commentEl.appendChild(commentAuthor);
        commentEl.appendChild(commentText);
        commentsList.appendChild(commentEl);
      });
    } else {
      const noComments = document.createElement("p");
      noComments.textContent = "No comments yet. Be the first to comment!";
      noComments.style.color = "#888";
      noComments.style.fontStyle = "italic";
      commentsList.appendChild(noComments);
    }

    commentsDiv.appendChild(commentsList);

    // Comment input
    const commentInput = document.createElement("textarea");
    commentInput.className = "comment-input";
    commentInput.placeholder = "Write a comment...";
    commentInput.rows = 2;

    const commentButton = document.createElement("button");
    commentButton.className = "comment-button";
    commentButton.textContent = "Post Comment";

    commentsDiv.appendChild(commentInput);
    commentsDiv.appendChild(commentButton);

    // Assemble post element
    postElement.appendChild(titleEl);
    postElement.appendChild(contentEl);
    postElement.appendChild(metaEl);
    postElement.appendChild(voteDiv);
    postElement.appendChild(commentsDiv);

    // Event Listeners
    const upvoteButton = voteDiv.querySelector(".upvote-button");
    const downvoteButton = voteDiv.querySelector(".downvote-button");
    const voteCountEl = voteDiv.querySelector(".vote-count");

    // Handle Upvote
    upvoteButton.addEventListener("click", async () => {
      if (!API_CONFIG.isLoggedIn()) {
        Toast.warning("Please log in to vote.");
        return;
      }

      upvoteButton.disabled = true;

      try {
        const result = await API_CONFIG.request(`/posts/${post._id}/upvote`, {
          method: 'POST'
        });

        // Update UI
        voteCountEl.textContent = result.voteScore;
        upvoteButton.classList.toggle('active', result.hasUpvoted);
        downvoteButton.classList.toggle('active', result.hasDownvoted);
      } catch (error) {
        Toast.error(error.message || "Failed to vote");
      } finally {
        upvoteButton.disabled = false;
      }
    });

    // Handle Downvote
    downvoteButton.addEventListener("click", async () => {
      if (!API_CONFIG.isLoggedIn()) {
        Toast.warning("Please log in to vote.");
        return;
      }

      downvoteButton.disabled = true;

      try {
        const result = await API_CONFIG.request(`/posts/${post._id}/downvote`, {
          method: 'POST'
        });

        // Update UI
        voteCountEl.textContent = result.voteScore;
        upvoteButton.classList.toggle('active', result.hasUpvoted);
        downvoteButton.classList.toggle('active', result.hasDownvoted);
      } catch (error) {
        Toast.error(error.message || "Failed to vote");
      } finally {
        downvoteButton.disabled = false;
      }
    });

    // Handle Comment
    commentButton.addEventListener("click", async () => {
      const commentText = commentInput.value.trim();

      if (!commentText) {
        Toast.warning("Please enter a comment.");
        return;
      }

      if (!API_CONFIG.isLoggedIn()) {
        Toast.warning("Please log in to comment.");
        return;
      }

      commentButton.disabled = true;
      commentButton.textContent = "Posting...";

      try {
        const newComment = await API_CONFIG.request(`/posts/${post._id}/comments`, {
          method: 'POST',
          body: { text: commentText }
        });

        // Remove "no comments" message if present
        const noCommentsMsg = commentsList.querySelector('p[style*="italic"]');
        if (noCommentsMsg) noCommentsMsg.remove();

        // Add new comment to list (safely)
        const commentEl = document.createElement("div");
        commentEl.className = "comment-item";
        commentEl.style.cssText = "padding: 10px; margin: 5px 0; background: #f8f8f8; border-radius: 5px;";

        const commentAuthor = document.createElement("strong");
        commentAuthor.textContent = newComment.author + ": ";

        const commentTextEl = document.createElement("span");
        commentTextEl.textContent = newComment.text;

        commentEl.appendChild(commentAuthor);
        commentEl.appendChild(commentTextEl);
        commentsList.appendChild(commentEl);

        // Update comment count
        const currentCount = parseInt(commentsHeader.textContent.match(/\d+/)?.[0] || 0);
        commentsHeader.textContent = `Comments (${currentCount + 1})`;

        commentInput.value = "";
        Toast.success("Comment posted!");
      } catch (error) {
        Toast.error(error.message || "Failed to post comment");
      } finally {
        commentButton.disabled = false;
        commentButton.textContent = "Post Comment";
      }
    });

    // Add to container
    if (prepend) {
      postsContainer.insertBefore(postElement, postsContainer.firstChild);
    } else {
      postsContainer.appendChild(postElement);
    }
  }

  // Fetch existing posts on page load
  fetchPosts();
});

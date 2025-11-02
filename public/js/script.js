// Loading spinner for legacy /itineraries/new page
document.addEventListener('DOMContentLoaded', () => {
  const itineraryForm = document.querySelector('#new-itinerary-form');
  const loadingSpinner = document.querySelector('#loading-spinner');
  if (itineraryForm && loadingSpinner) {
    itineraryForm.addEventListener('submit', () => {
      if (itineraryForm.checkValidity()) {
        itineraryForm.style.display = 'none';
        loadingSpinner.style.display = 'block';
      }
    });
  }

  // New Trip Modal AJAX submit
  const newTripForm = document.getElementById('newTripForm');
  const submitBtn = document.getElementById('submitNewTrip');
  const modalLoading = document.getElementById('modal-loading');
  if (newTripForm && submitBtn) {
    submitBtn.addEventListener('click', async () => {
      if (!newTripForm.checkValidity()) {
        newTripForm.classList.add('was-validated');
        return;
      }
      submitBtn.disabled = true;
      modalLoading.style.display = 'block';
      try {
        const fd = new FormData(newTripForm);
        const body = new URLSearchParams(fd);
        const res = await fetch('/itineraries', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body
        });
        const data = await res.json().catch(() => ({ ok: false, error: 'Unexpected server response' }));
        const msg = document.createElement('div');
        msg.className = 'alert mt-3';
        if (data && data.ok) {
          msg.classList.add('alert-success');
          msg.innerHTML = `Your personalized itinerary has been generated! <a class="alert-link" href="${data.url}">View it now</a>.`;
          newTripForm.reset();
        } else {
          msg.classList.add('alert-danger');
          msg.textContent = data && data.error ? data.error : 'Failed to generate itinerary.';
        }
        // Remove old alerts and append
        newTripForm.querySelectorAll('.alert').forEach(a => a.remove());
        newTripForm.appendChild(msg);
      } catch (e) {
        const msg = document.createElement('div');
        msg.className = 'alert alert-danger mt-3';
        msg.textContent = 'Network error. Please try again.';
        newTripForm.querySelectorAll('.alert').forEach(a => a.remove());
        newTripForm.appendChild(msg);
      } finally {
        submitBtn.disabled = false;
        modalLoading.style.display = 'none';
      }
    });
  }
});
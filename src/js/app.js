import '../scss/style.scss';

document.addEventListener('DOMContentLoaded', () => {
  const addTeacherButtons = document.querySelectorAll('.add-teacher-btn');
  const addTeacherPopup = document.getElementById('addTeacherPopup');
  const closeAddTeacherButton = document.getElementById('closeAddTeacherPopup');

  const openAddTeacherPopup = () => {
    if (addTeacherPopup) {
      addTeacherPopup.classList.add('popup--visible');
    }
  };

  const closeAddTeacherPopup = () => {
    if (addTeacherPopup) {
      addTeacherPopup.classList.remove('popup--visible');
    }
  };

  addTeacherButtons.forEach((button) => button.addEventListener('click', openAddTeacherPopup));
  if (closeAddTeacherButton) {
    closeAddTeacherButton.addEventListener('click', closeAddTeacherPopup);
  }
  if (addTeacherPopup) {
    addTeacherPopup.addEventListener('click', (e) => {
      if (e.target === addTeacherPopup) {
        closeAddTeacherPopup();
      }
    });
  }
  const teacherCards = document.querySelectorAll('.teacher-card');
  const teacherInfoPopup = document.getElementById('teacherInfoPopup');
  const closeTeacherInfoButton = document.getElementById('closeTeacherInfoPopup');

  let closeTeacherInfoPopup = () => {};

  if (teacherInfoPopup) {
    const popupContentInfo = teacherInfoPopup.querySelector('.popup-content--info');
    const popupAvatar = teacherInfoPopup.querySelector('.info-avatar');
    const popupName = teacherInfoPopup.querySelector('.info-name');
    const popupSubject = teacherInfoPopup.querySelector('.info-subject');
    const popupLocation = teacherInfoPopup.querySelector('.info-location');
    const popupEmail = teacherInfoPopup.querySelector('.info-email');
    const defaultAvatar = './images/default-avatar.png';

    const openTeacherInfoPopup = (card) => {
      const cardAvatar = card.querySelector('.teacher-avatar');
      const cardName = card.querySelector('.teacher-name');
      const cardSubject = card.querySelector('.teacher-subject');
      const cardLocation = card.querySelector('.teacher-location');
      const isFavorite = card.querySelector('.star-badge') !== null;

      const imgElement = cardAvatar.querySelector('img');
      const initialsElement = cardAvatar.querySelector('.initials');

      if (imgElement && imgElement.src) {
        popupAvatar.innerHTML = `<img src="${imgElement.src}" alt="${imgElement.alt}">`;
      } else if (initialsElement) {
        popupAvatar.innerHTML = `<div class="teacher-avatar initial-avatar"><span class="initials">${initialsElement.textContent}</span></div>`;
      } else {
        popupAvatar.innerHTML = `<img src="${defaultAvatar}" alt="Default Avatar">`;
      }

      const existingStar = popupContentInfo.querySelector('.info-star');
      if (existingStar) {
        existingStar.remove();
      }
      const starElement = document.createElement('span');
      starElement.classList.add('info-star');
      if (isFavorite) {
        starElement.classList.add('is-favorite');
        starElement.textContent = '★';
      } else {
        starElement.classList.add('not-favorite');
        starElement.textContent = '☆';
      }
      popupContentInfo.appendChild(starElement);

      popupName.innerHTML = cardName.innerHTML;

      if (cardSubject) {
        popupSubject.textContent = cardSubject.textContent;
        popupSubject.style.display = 'block';
      } else {
        popupSubject.style.display = 'none';
      }

      if (cardLocation) {
        popupLocation.textContent = cardLocation.textContent;
      }

      const nameText = cardName.innerHTML.replace(/<br\s*\/?>/gi, ' ');
      const nameForEmail = nameText.replace(/\s+/g, '.').toLowerCase();
      popupEmail.href = `mailto:${nameForEmail}@example.com`;
      popupEmail.textContent = `${nameForEmail}@example.com`;

      teacherInfoPopup.classList.add('popup--visible');
    };

    closeTeacherInfoPopup = () => {
      teacherInfoPopup.classList.remove('popup--visible');
    };

    teacherCards.forEach((card) => card.addEventListener('click', () => openTeacherInfoPopup(card)));
    if (closeTeacherInfoButton) {
      closeTeacherInfoButton.addEventListener('click', closeTeacherInfoPopup);
    }
    teacherInfoPopup.addEventListener('click', (e) => {
      if (e.target === teacherInfoPopup) {
        closeTeacherInfoPopup();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAddTeacherPopup();
      closeTeacherInfoPopup();
    }
  });
});

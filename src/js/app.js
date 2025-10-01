/* eslint-disable */
import '../scss/style.scss';
import { getTeachers, capitalize } from './data-processor.js';

let allTeachers = [];
const topTeachersGrid = document.querySelector('.teachers-grid');
const favoritesGrid = document.querySelector('.favorites-grid');
const statsTableBody = document.getElementById('stats-table-body');
const statsTableHeader = document.getElementById('stats-table-header');

let currentPage = 1;
let currentFilters = { country: 'all', age: 'all', gender: 'all', photo: false, favorite: false };
let currentSearchTerm = '';
let sortState = { key: 'full_name', direction: 'asc' };

const createTeacherCardHTML = (teacher) => {
  const hasPhoto = teacher.picture_large;
  const initials = teacher.full_name.split(' ').map((n) => n[0]).join('');
  const [firstName, lastName] = teacher.full_name.split(' ');
  const avatarHTML = hasPhoto
      ? `<img src="${teacher.picture_large}" alt="${teacher.full_name}" referrerpolicy="no-referrer">`
      : `<div class="teacher-avatar initial-avatar" style="background-color: ${teacher.bg_color};"><span class="initials">${initials}</span></div>`;
  const starHTML = teacher.favorite ? '<div class="star-badge">★</div>' : '';
  return `
    <div class="teacher-card" data-teacher-id="${teacher.id}">
        <div class="teacher-avatar">${avatarHTML}${starHTML}</div>
        <h3 class="teacher-name">${firstName || ''}<br>${lastName || ''}</h3>
        <p class="teacher-subject">${teacher.course || 'N/A'}</p>
        <p class="teacher-location">${teacher.country || ''}</p>
    </div>`;
};

const renderTeachers = (container, teachers, append = false) => {
  if (!container) return;

  const content = teachers.length > 0
      ? teachers.map(createTeacherCardHTML).join('')
      : '';

  if (append) {
    container.insertAdjacentHTML('beforeend', content);
  } else {
    if (allTeachers.length === 0) {
      container.innerHTML = '<p class="loading-message">Loading teachers...</p>';
    } else if (teachers.length === 0) {
      container.innerHTML = '<p class="no-teachers-found">No teachers found matching your criteria.</p>';
    }
    else {
      container.innerHTML = content;
    }
  }
};

const renderStatisticsTable = (teachers) => {
  if (!statsTableBody) return;
  statsTableBody.innerHTML = teachers.map(teacher => `
        <tr>
            <td>${teacher.full_name}</td>
            <td>${teacher.course || 'N/A'}</td>
            <td>${teacher.age}</td>
            <td>${teacher.gender}</td>
            <td>${teacher.country}</td>
        </tr>`).join('');
};

const sortAndRenderStatistics = () => {
  const currentlyDisplayedTeachers = applyFilters(allTeachers);
  const sortedTeachers = [...currentlyDisplayedTeachers].sort((a, b) => {
    const key = sortState.key;
    const direction = sortState.direction === 'asc' ? 1 : -1;
    const valA = a[key] || '';
    const valB = b[key] || '';
    if (key === 'age') return (valA - valB) * direction;
    if (typeof valA === 'string') return valA.localeCompare(valB) * direction;
    return 0;
  });

  statsTableHeader.querySelectorAll('th').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (th.dataset.sortBy === sortState.key) {
      th.classList.add(`sorted-${sortState.direction}`);
    }
  });
  renderStatisticsTable(sortedTeachers);
};

function applyFilters(teachers) {
  const searchTerm = currentSearchTerm.toLowerCase().trim();

  return teachers.filter(t => {
    const matchesSearch = !searchTerm ||
        t.full_name.toLowerCase().includes(searchTerm) ||
        (t.note && t.note.toLowerCase().includes(searchTerm)) ||
        String(t.age).includes(searchTerm);

    const matchesFilters = (currentFilters.country === 'all' || t.country === currentFilters.country) &&
        (currentFilters.gender === 'all' || t.gender === currentFilters.gender) &&
        (!currentFilters.photo || t.picture_large) &&
        (!currentFilters.favorite || t.favorite) &&
        (currentFilters.age === 'all' ||
            (currentFilters.age === '18-30' && t.age >= 18 && t.age <= 30) ||
            (currentFilters.age === '31-45' && t.age >= 31 && t.age <= 45) ||
            (currentFilters.age === '46+' && t.age >= 46));

    return matchesSearch && matchesFilters;
  });
}

const rerenderAllLists = () => {
  const filteredTeachers = applyFilters(allTeachers);
  renderTeachers(topTeachersGrid, filteredTeachers, false);
  renderTeachers(favoritesGrid, allTeachers.filter(t => t.favorite));
  sortAndRenderStatistics();
};


const calculateAge = (birthDate) => {
  const today = new Date();
  let age = today.getFullYear() - new Date(birthDate).getFullYear();
  const m = today.getMonth() - new Date(birthDate).getMonth();
  if (m < 0 || (m === 0 && today.getDate() < new Date(birthDate).getDate())) age--;
  return age;
};

async function main() {
  const addTeacherForm = document.getElementById('add-teacher-form');
  const formErrorsContainer = document.querySelector('.form-errors');
  const teacherInfoPopup = document.getElementById('teacherInfoPopup');
  const popupStar = document.getElementById('popupStar');

  renderTeachers(topTeachersGrid, [], false);

  allTeachers = await getTeachers(currentPage, 50);

  populateFilters();
  populateAddTeacherFormDropdowns();
  rerenderAllLists();
  setupEventListeners();

  function populateFilters() {
    const countryFilter = document.getElementById('country-filter');
    const genderFilter = document.getElementById('gender-filter');
    const ageFilter = document.getElementById('age-filter');

    const countries = [...new Set(allTeachers.map(t => t.country).filter(Boolean))].sort();
    const currentCountry = countryFilter.value;
    countryFilter.innerHTML = '<option value="all">All Countries</option>';
    countries.forEach(c => countryFilter.add(new Option(c, c)));
    if (countries.includes(currentCountry)) {
      countryFilter.value = currentCountry;
    }

    const genders = [...new Set(allTeachers.map(t => t.gender).filter(Boolean))].sort();
    const currentGender = genderFilter.value;
    genderFilter.innerHTML = '<option value="all">All Genders</option>';
    genders.forEach(g => genderFilter.add(new Option(g, g)));
    if (genders.includes(currentGender)) {
      genderFilter.value = currentGender;
    }

    if (ageFilter.innerHTML === "") {
      ageFilter.innerHTML = `<option value="all">All Ages</option><option value="18-30">18-30</option><option value="31-45">31-45</option><option value="46+">46+</option>`;
    }
  }

  function populateAddTeacherFormDropdowns() {
    const specialtySelect = document.getElementById('specialty');
    const countrySelect = document.getElementById('country');
    const COURSES = [
      'Mathematics', 'Physics', 'English', 'Computer Science', 'Dancing',
      'Chess', 'Biology', 'Chemistry', 'Law', 'Art', 'Medicine', 'Statistics'
    ];
    const COUNTRIES = [
      'Ukraine', 'Poland', 'USA', 'Germany', 'France', 'United Kingdom', 'Canada', 'Australia', 'Ireland', 'Spain', 'Italy', 'Norway', 'Finland'
    ];

    specialtySelect.innerHTML = '<option value="">Select specialty</option>';
    COURSES.forEach(course => {
      specialtySelect.add(new Option(course, course));
    });

    countrySelect.innerHTML = '<option value="">Select country</option>';
    COUNTRIES.sort().forEach(country => {
      countrySelect.add(new Option(country, country));
    });
  }

  function setupEventListeners() {
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-btn');
    const loadMoreBtn = document.getElementById('load-more-btn');

    loadMoreBtn.addEventListener('click', async () => {
      loadMoreBtn.textContent = 'Loading...';
      loadMoreBtn.disabled = true;

      currentPage++;
      const newTeachers = await getTeachers(currentPage, 10);
      allTeachers.push(...newTeachers);

      rerenderAllLists();
      populateFilters();

      loadMoreBtn.textContent = 'Load More';
      loadMoreBtn.disabled = false;
    });

    document.querySelector('.filters').addEventListener('change', e => {
      const { id, value, checked } = e.target;
      if (id === 'country-filter') currentFilters.country = value;
      if (id === 'age-filter') currentFilters.age = value;
      if (id === 'gender-filter') currentFilters.gender = value;
      if (id === 'photo-filter') currentFilters.photo = checked;
      if (id === 'favorite-filter') currentFilters.favorite = checked;
      rerenderAllLists();
    });

    searchButton.addEventListener('click', () => {
      currentSearchTerm = searchInput.value;
      rerenderAllLists();
    });

    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        currentSearchTerm = searchInput.value;
        rerenderAllLists();
      }
    });

    statsTableHeader.addEventListener('click', (e) => {
      const target = e.target.closest('th');
      if (!target || !target.dataset.sortBy) return;
      const sortKey = target.dataset.sortBy;
      if (sortState.key === sortKey) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortState.key = sortKey;
        sortState.direction = 'asc';
      }
      sortAndRenderStatistics();
    });

    addTeacherForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      formErrorsContainer.innerHTML = '';
      formErrorsContainer.classList.remove('visible');
      const errors = [];
      const formData = new FormData(e.target);
      const requiredFields = ['name', 'specialty', 'country', 'city', 'email', 'phone', 'dob'];

      requiredFields.forEach(field => {
        const value = formData.get(field);
        if (!value || !value.trim()) {
          errors.push(`${capitalize(field)} is required.`);
        }
      });
      const email = formData.get('email').trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format.');
      }
      const dob = formData.get('dob');
      const age = dob ? calculateAge(dob) : null;
      if (dob && age < 18) {
        errors.push('Teacher must be at least 18 years old.');
      }
      const uniqueErrors = [...new Set(errors)];
      if (uniqueErrors.length > 0) {
        formErrorsContainer.innerHTML = uniqueErrors.map(err => `<p>${err}</p>`).join('');
        formErrorsContainer.classList.add('visible');
        return;
      }

      const newTeacherData = {
        full_name: formData.get('name').trim(),
        course: formData.get('specialty'),
        country: formData.get('country'),
        city: formData.get('city').trim(),
        email,
        phone: formData.get('phone').trim(),
        b_date: dob,
        age,
        gender: capitalize(formData.get('sex')),
        note: formData.get('notes').trim(),
        favorite: false,
        bg_color: formData.get('color'),
        picture_large: null,
        picture_thumbnail: null,
      };

      try {
        const response = await fetch('http://localhost:3000/teachers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newTeacherData),
        });

        if (!response.ok) {
          throw new Error('Server responded with an error');
        }

        const savedTeacher = await response.json();

        allTeachers.unshift(savedTeacher);
        rerenderAllLists();
        populateFilters();
        closeAddTeacherPopup();
      } catch (error) {
        console.error('Failed to add teacher:', error);
        formErrorsContainer.innerHTML = '<p>Could not save the teacher. Please try again later.</p>';
        formErrorsContainer.classList.add('visible');
      }
    });

    const addTeacherPopup = document.getElementById('addTeacherPopup');
    const closeAddTeacherButton = document.getElementById('closeAddTeacherPopup');
    const openAddTeacherButtons = document.querySelectorAll('.add-teacher-btn:not(#load-more-btn)');
    const colorInput = document.getElementById('color');
    const colorPickerContainer = colorInput.parentElement;

    if(colorInput && colorPickerContainer) {
      colorPickerContainer.style.backgroundColor = colorInput.value;

      colorInput.addEventListener('input', () => {
        colorPickerContainer.style.backgroundColor = colorInput.value;
      });
    }

    const openAddTeacherPopup = () => {
      addTeacherPopup.classList.add('popup--visible');
      if(colorInput && colorPickerContainer){
        colorPickerContainer.style.backgroundColor = colorInput.value;
      }
    };
    const closeAddTeacherPopup = () => {
      if(formErrorsContainer) {
        formErrorsContainer.innerHTML = '';
        formErrorsContainer.classList.remove('visible');
      }
      addTeacherPopup.classList.remove('popup--visible');
      addTeacherForm.reset();
      if(colorInput && colorPickerContainer){
        colorPickerContainer.style.backgroundColor = colorInput.value;
      }
    };
    openAddTeacherButtons.forEach(btn => btn.addEventListener('click', openAddTeacherPopup));
    closeAddTeacherButton.addEventListener('click', closeAddTeacherPopup);

    if (teacherInfoPopup) {
      const closeTeacherInfoButton = document.getElementById('closeTeacherInfoPopup');
      const popupAvatar = teacherInfoPopup.querySelector('.info-avatar');
      const popupName = teacherInfoPopup.querySelector('.info-name');
      const popupSubject = teacherInfoPopup.querySelector('.info-subject');
      const popupAgeGender = teacherInfoPopup.querySelector('.info-age-gender');
      const popupLocation = teacherInfoPopup.querySelector('.info-location');
      const popupEmail = teacherInfoPopup.querySelector('.info-email');
      const popupPhone = teacherInfoPopup.querySelector('.info-phone');
      const popupDescription = teacherInfoPopup.querySelector('.info-description');
      const openTeacherInfoPopup = (teacher) => {
        if (!teacher) return;
        teacherInfoPopup.dataset.currentTeacherId = teacher.id;
        const initials = teacher.full_name.split(' ').map((n) => n[0]).join('');
        popupAvatar.innerHTML = teacher.picture_large
            ? `<img src="${teacher.picture_large}" alt="${teacher.full_name}" referrerpolicy="no-referrer">`
            : `<div class="initial-avatar" style="background-color: ${teacher.bg_color};"><span class="initials">${initials}</span></div>`;
        popupName.textContent = teacher.full_name;
        popupSubject.textContent = teacher.course || 'N/A';
        popupAgeGender.textContent = `${teacher.age}, ${teacher.gender}`;
        popupLocation.textContent = `${teacher.city || ''}, ${teacher.country || ''}`;
        popupEmail.href = `mailto:${teacher.email}`;
        popupEmail.textContent = teacher.email;
        popupPhone.textContent = teacher.phone;
        popupDescription.textContent = teacher.note;
        updatePopupStar(teacher.favorite);
        teacherInfoPopup.classList.add('popup--visible');
      };
      const updatePopupStar = (isFavorite) => {
        popupStar.textContent = '★';
        if (isFavorite) {
          popupStar.classList.add('is-favorite');
          popupStar.classList.remove('not-favorite');
        } else {
          popupStar.classList.add('not-favorite');
          popupStar.classList.remove('is-favorite');
        }
      };
      popupStar.addEventListener('click', async () => {
        const teacherId = teacherInfoPopup.dataset.currentTeacherId;
        const teacher = allTeachers.find(t => t.id === teacherId);
        if (teacher) {
          teacher.favorite = !teacher.favorite;
          updatePopupStar(teacher.favorite);
          rerenderAllLists();

          if (!isNaN(parseInt(teacher.id, 10))) {
            try {
              await fetch(`http://localhost:3000/teachers/${teacher.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ favorite: teacher.favorite }),
              });
            } catch (error) {
              console.error("Failed to update favorite status on server:", error);
              teacher.favorite = !teacher.favorite;
              updatePopupStar(teacher.favorite);
              rerenderAllLists();
            }
          }
        }
      });
      const closeTeacherInfoPopup = () => teacherInfoPopup.classList.remove('popup--visible');
      const handleTeacherClick = (event) => {
        const card = event.target.closest('.teacher-card');
        if (!card) return;
        const teacherId = card.dataset.teacherId;
        const teacher = allTeachers.find((t) => t.id === teacherId);
        openTeacherInfoPopup(teacher);
      };
      topTeachersGrid.addEventListener('click', handleTeacherClick);
      favoritesGrid.addEventListener('click', handleTeacherClick);
      closeTeacherInfoButton.addEventListener('click', closeTeacherInfoPopup);

      // Add universal popup closing logic
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeAddTeacherPopup();
          closeTeacherInfoPopup();
        }
      });

      addTeacherPopup.addEventListener('click', (e) => {
        if (e.target === addTeacherPopup) {
          closeAddTeacherPopup();
        }
      });

      teacherInfoPopup.addEventListener('click', (e) => {
        if (e.target === teacherInfoPopup) closeTeacherInfoPopup();
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', main);

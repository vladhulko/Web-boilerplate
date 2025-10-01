/* eslint-disable */
import '../scss/style.scss';
import { getTeachers, capitalize, getRandomHexColor } from './data-processor.js';

let allTeachers = getTeachers();
const topTeachersGrid = document.querySelector('.teachers-grid');
const favoritesGrid = document.querySelector('.favorites-grid');
const statsTableBody = document.getElementById('stats-table-body');
const statsTableHeader = document.getElementById('stats-table-header');

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

const renderTeachers = (container, teachers) => {
  if (!container) return;
  container.innerHTML = teachers.length > 0
      ? teachers.map(createTeacherCardHTML).join('')
      : '<p class="no-teachers-found">No teachers found matching your criteria.</p>';
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
  const sortedTeachers = [...allTeachers].sort((a, b) => {
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

function applyAndRenderFilters() {
  let filteredTeachers = [...allTeachers];
  const searchTerm = currentSearchTerm.toLowerCase().trim();

  if (searchTerm) {
    filteredTeachers = filteredTeachers.filter(t =>
        t.full_name.toLowerCase().includes(searchTerm) ||
        t.note.toLowerCase().includes(searchTerm) ||
        String(t.age).includes(searchTerm));
  }

  filteredTeachers = filteredTeachers.filter(t => {
    if (currentFilters.country !== 'all' && t.country !== currentFilters.country) return false;
    if (currentFilters.age !== 'all') {
      if (currentFilters.age === '18-30' && (t.age < 18 || t.age > 30)) return false;
      if (currentFilters.age === '31-45' && (t.age < 31 || t.age > 45)) return false;
      if (currentFilters.age === '46+' && t.age < 46) return false;
    }
    if (currentFilters.gender !== 'all' && t.gender !== currentFilters.gender) return false;
    if (currentFilters.photo && !t.picture_large) return false;
    if (currentFilters.favorite && !t.favorite) return false;
    return true;
  });

  renderTeachers(topTeachersGrid, filteredTeachers);
}

const rerenderAllLists = () => {
  applyAndRenderFilters();
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

document.addEventListener('DOMContentLoaded', () => {
  const addTeacherForm = document.getElementById('add-teacher-form');
  const formErrorsContainer = document.querySelector('.form-errors');
  const teacherInfoPopup = document.getElementById('teacherInfoPopup');
  const popupStar = document.getElementById('popupStar');

  function populateFilters() {
    const countryFilter = document.getElementById('country-filter');
    const genderFilter = document.getElementById('gender-filter');
    const ageFilter = document.getElementById('age-filter');

    const countries = [...new Set(allTeachers.map(t => t.country).filter(Boolean))].sort();
    countryFilter.innerHTML = '<option value="all">All Countries</option>';
    countries.forEach(c => countryFilter.add(new Option(c, c)));

    const genders = [...new Set(allTeachers.map(t => t.gender).filter(Boolean))].sort();
    genderFilter.innerHTML = '<option value="all">All Genders</option>';
    genders.forEach(g => genderFilter.add(new Option(g, g)));

    ageFilter.innerHTML = `<option value="all">All Ages</option><option value="18-30">18-30</option><option value="31-45">31-45</option><option value="46+">46+</option>`;
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

    document.querySelector('.filters').addEventListener('change', e => {
      const { id, value, checked } = e.target;
      if (id === 'country-filter') currentFilters.country = value;
      if (id === 'age-filter') currentFilters.age = value;
      if (id === 'gender-filter') currentFilters.gender = value;
      if (id === 'photo-filter') currentFilters.photo = checked;
      if (id === 'favorite-filter') currentFilters.favorite = checked;
      applyAndRenderFilters();
    });

    searchButton.addEventListener('click', () => {
      currentSearchTerm = searchInput.value;
      applyAndRenderFilters();
    });

    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        currentSearchTerm = searchInput.value;
        applyAndRenderFilters();
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

    addTeacherForm.addEventListener('submit', (e) => {
      e.preventDefault();
      formErrorsContainer.innerHTML = '';
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
        return;
      }

      const newTeacher = {
        id: crypto.randomUUID(),
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
        bg_color: getRandomHexColor(),
        picture_large: null,
        picture_thumbnail: null,
      };

      allTeachers.push(newTeacher);
      rerenderAllLists();
      populateFilters();
      closeAddTeacherPopup();
    });

    const addTeacherPopup = document.getElementById('addTeacherPopup');
    const closeAddTeacherButton = document.getElementById('closeAddTeacherPopup');
    const openAddTeacherButtons = document.querySelectorAll('.add-teacher-btn');
    const openAddTeacherPopup = () => addTeacherPopup.classList.add('popup--visible');
    const closeAddTeacherPopup = () => {
      if(formErrorsContainer) formErrorsContainer.innerHTML = '';
      addTeacherPopup.classList.remove('popup--visible');
      addTeacherForm.reset();
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

      popupStar.addEventListener('click', () => {
        const teacherId = teacherInfoPopup.dataset.currentTeacherId;
        const teacher = allTeachers.find(t => t.id === teacherId);
        if (teacher) {
          teacher.favorite = !teacher.favorite;
          updatePopupStar(teacher.favorite);
          rerenderAllLists();
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
      teacherInfoPopup.addEventListener('click', (e) => {
        if (e.target === teacherInfoPopup) closeTeacherInfoPopup();
      });
    }
  }

  populateFilters();
  populateAddTeacherFormDropdowns();
  rerenderAllLists();
  setupEventListeners();
});


/* eslint-disable */
import '../scss/style.scss';
import 'leaflet/dist/leaflet.css';
import '@webdatarocks/webdatarocks/webdatarocks.min.css';

import L from 'leaflet';
import Chart from 'chart.js/auto';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import WebDataRocks from '@webdatarocks/webdatarocks';

import { getTeachers, capitalize } from './data-processor.js';

dayjs.extend(relativeTime);

let allTeachers = [];
const topTeachersGrid = document.querySelector('.teachers-grid');
const favoritesGrid = document.querySelector('.favorites-grid');
const statsTableBody = document.getElementById('stats-table-body');
const statsTableHeader = document.getElementById('stats-table-header');

let currentPage = 1;
let currentFilters = { country: 'all', age: 'all', gender: 'all', photo: false, favorite: false };
let currentSearchTerm = '';
let sortState = { key: 'full_name', direction: 'asc' };
let map = null;
let statsChart = null;
let pivotTable = null;

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
  if (allTeachers.length === 0 && teachers.length === 0) {
    container.innerHTML = '<p class="loading-message">Loading teachers...</p>';
    return;
  }
  if (teachers.length === 0) {
    container.innerHTML = '<p class="no-teachers-found">No teachers found matching your criteria.</p>';
    return;
  }
  container.innerHTML = teachers.map(createTeacherCardHTML).join('');
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

const renderStatisticsChart = (teachers) => {
  const ctx = document.getElementById('statsPieChart')?.getContext('2d');
  if (!ctx) return;
  const countryCounts = teachers.reduce((acc, teacher) => {
    const country = teacher.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});
  const labels = Object.keys(countryCounts);
  const data = Object.values(countryCounts);
  const CHART_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#77DD77', '#836953', '#FFB347'];
  const backgroundColors = labels.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]);

  if (statsChart) statsChart.destroy();
  statsChart = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ label: 'Teachers by Country', data, backgroundColor: backgroundColors }] },
    options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Distribution of Teachers by Country' } } }
  });
};

const renderPivotTable = (teachers) => {
  if (document.getElementById('stats-pivot-view').classList.contains('active')) {
    if (pivotTable) {
      pivotTable.updateData({ data: teachers });
    } else {
      pivotTable = new WebDataRocks({
        container: "#pivot-container",
        toolbar: true,
        report: {
          dataSource: { data: teachers },
          slice: {
            rows: [{ uniqueName: "country", caption: "Country" }, { uniqueName: "full_name", caption: "Full Name" }],
            columns: [{ uniqueName: "gender", caption: "Gender" }],
            measures: [{ uniqueName: "age", aggregation: "average", caption: "Average Age" }],
          },
          options: { grid: { type: "flat" } }
        },
        afterfullscreen: () => {
          setTimeout(() => pivotTable?.refresh(), 0);
        }
      });
    }
  }
};

function applyFilters(teachers) {
  const searchTerm = currentSearchTerm.toLowerCase().trim();
  return teachers.filter(t => {
    const matchesSearch = !searchTerm ||
        t.full_name.toLowerCase().includes(searchTerm) ||
        (t.note && t.note.toLowerCase().includes(searchTerm)) ||
        String(t.age).includes(searchTerm);

    let matchesAge = true;
    if (currentFilters.age !== 'all') {
      const [min, max] = currentFilters.age.split('-').map(Number);
      matchesAge = max ? (t.age >= min && t.age <= max) : t.age >= min;
    }

    return matchesSearch &&
        (currentFilters.country === 'all' || t.country === currentFilters.country) &&
        (currentFilters.gender === 'all' || t.gender === currentFilters.gender) &&
        (!currentFilters.photo || t.picture_large) &&
        (!currentFilters.favorite || t.favorite) &&
        matchesAge;
  });
}

const sortAndRenderStatistics = (teachers) => {
  const sortedTeachers = [...teachers].sort((a, b) => {
    const key = sortState.key;
    const direction = sortState.direction === 'asc' ? 1 : -1;
    const valA = a[key] || '';
    const valB = b[key] || '';
    if (key === 'age') return (valA - valB) * direction;
    return valA.localeCompare(valB) * direction;
  });
  statsTableHeader.querySelectorAll('th').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (th.dataset.sortBy === sortState.key) {
      th.classList.add(`sorted-${sortState.direction}`);
    }
  });
  renderStatisticsTable(sortedTeachers);
};

const rerenderAllLists = () => {
  const filteredTeachers = applyFilters(allTeachers);
  renderTeachers(topTeachersGrid, filteredTeachers);
  renderTeachers(favoritesGrid, allTeachers.filter(t => t.favorite));
  sortAndRenderStatistics(filteredTeachers);
  renderStatisticsChart(filteredTeachers);
  renderPivotTable(filteredTeachers);
};

async function main() {
  renderTeachers(topTeachersGrid, []);
  allTeachers = await getTeachers(1, 50);
  setupEventListeners();
  populateFilters();
  rerenderAllLists();
}

function populateFilters() {
  const countryFilter = document.getElementById('country-filter');
  const ageFilter = document.getElementById('age-filter');
  const countries = [...new Set(allTeachers.map(t => t.country).filter(Boolean))].sort();

  countryFilter.innerHTML = '<option value="all">All Countries</option>';
  countries.forEach(c => countryFilter.add(new Option(c, c)));

  if (ageFilter.options.length <= 1) { // To avoid re-adding options
    ageFilter.add(new Option('18-30', '18-30'));
    ageFilter.add(new Option('31-45', '31-45'));
    ageFilter.add(new Option('46+', '46-Infinity'));
  }
}

function setupEventListeners() {
  const searchInput = document.querySelector('.search-input');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const teacherInfoPopup = document.getElementById('teacherInfoPopup');
  const addTeacherPopup = document.getElementById('addTeacherPopup');

  document.querySelector('.filters').addEventListener('change', e => {
    const { id, value, type, checked } = e.target;
    if (id === 'country-filter') currentFilters.country = value;
    if (id === 'age-filter') currentFilters.age = value;
    if (id === 'gender-filter') currentFilters.gender = value;
    if (id === 'photo-filter') currentFilters.photo = checked;
    if (id === 'favorite-filter') currentFilters.favorite = checked;
    rerenderAllLists();
  });

  searchInput.addEventListener('input', () => {
    currentSearchTerm = searchInput.value;
    rerenderAllLists();
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
    rerenderAllLists();
  });

  document.querySelector('.stats-tabs').addEventListener('click', (e) => {
    if (e.target.classList.contains('stats-tab')) {
      const view = e.target.dataset.view;
      document.querySelector('.stats-tab.active').classList.remove('active');
      e.target.classList.add('active');
      document.querySelector('.stats-view.active').classList.remove('active');
      document.getElementById(`stats-${view}-view`).classList.add('active');
      if (view === 'pivot') {
        renderPivotTable(applyFilters(allTeachers));
      }
    }
  });

  const openTeacherInfoPopup = (teacher) => {
    if (!teacher) return;
    teacherInfoPopup.dataset.currentTeacherId = teacher.id;
    const popupAvatar = teacherInfoPopup.querySelector('.info-avatar');
    const popupName = teacherInfoPopup.querySelector('.info-name');
    const popupSubject = teacherInfoPopup.querySelector('.info-subject');
    const popupAgeGender = teacherInfoPopup.querySelector('.info-age-gender');
    const popupBirthday = teacherInfoPopup.querySelector('.info-birthday');
    const popupLocation = teacherInfoPopup.querySelector('.info-location');
    const popupEmail = teacherInfoPopup.querySelector('.info-email');
    const popupPhone = teacherInfoPopup.querySelector('.info-phone');
    const popupDescription = teacherInfoPopup.querySelector('.info-description');
    const popupStar = document.getElementById('popupStar');
    const mapToggle = teacherInfoPopup.querySelector('.info-map-toggle');

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

    const today = dayjs();
    let nextBirthday = dayjs(teacher.b_date).year(today.year());
    if (nextBirthday.isBefore(today, 'day')) nextBirthday = nextBirthday.add(1, 'year');
    const daysUntilBirthday = nextBirthday.diff(today, 'day');
    popupBirthday.textContent = daysUntilBirthday <= 0 ? 'Happy Birthday! 🎉' : `Next birthday in ${daysUntilBirthday + 1} days`;

    const updatePopupStar = (isFavorite) => {
      popupStar.textContent = '★';
      popupStar.classList.toggle('is-favorite', isFavorite);
      popupStar.classList.toggle('not-favorite', !isFavorite);
    };
    updatePopupStar(teacher.favorite);

    const mapContainer = document.getElementById('map');
    mapContainer.style.display = 'none';
    if (map) { map.remove(); map = null; }

    mapToggle.onclick = (e) => {
      e.preventDefault();
      const isHidden = mapContainer.style.display === 'none';
      mapContainer.style.display = isHidden ? 'block' : 'none';
      if (isHidden && !map) {
        const coords = [parseFloat(teacher.coordinates.latitude), parseFloat(teacher.coordinates.longitude)];
        map = L.map(mapContainer).setView(coords, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker(coords).addTo(map).bindPopup(teacher.full_name).openPopup();
      }
    };
    teacherInfoPopup.classList.add('popup--visible');
  };

  const handleTeacherClick = (event) => {
    const card = event.target.closest('.teacher-card');
    if (card) {
      const teacher = allTeachers.find(t => t.id === card.dataset.teacherId);
      openTeacherInfoPopup(teacher);
    }
  };
  topTeachersGrid.addEventListener('click', handleTeacherClick);
  favoritesGrid.addEventListener('click', handleTeacherClick);

  const closePopups = () => {
    teacherInfoPopup.classList.remove('popup--visible');
    addTeacherPopup.classList.remove('popup--visible');
  }
  document.querySelectorAll('.popup-close').forEach(btn => btn.addEventListener('click', closePopups));
  document.querySelectorAll('.popup').forEach(p => p.addEventListener('click', (e) => { if (e.target === p) closePopups(); }));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopups(); });
}

document.addEventListener('DOMContentLoaded', main);


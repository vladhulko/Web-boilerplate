/* eslint-disable */
import _ from 'lodash';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Chart from 'chart.js/auto';
import L from 'leaflet';
import WebDataRocks from '@webdatarocks/webdatarocks';

// Import local styles and modules
import 'leaflet/dist/leaflet.css';
import '@webdatarocks/webdatarocks/webdatarocks.min.css';
import '../scss/style.scss';
import { getTeachers } from './data-processor.js';

// Extend dayjs with necessary plugin
dayjs.extend(relativeTime);

// --- STATE MANAGEMENT ---
let allTeachers = [];
let currentPage = 1;
let currentFilters = { country: 'all', age: 'all', gender: 'all', photo: false, favorite: false };
let currentSearchTerm = '';
let sortState = { key: 'full_name', direction: 'asc' };

// --- CACHED DOM ELEMENTS ---
const topTeachersGrid = document.querySelector('.teachers-grid');
const favoritesGrid = document.querySelector('.favorites-grid');
const statsTableBody = document.getElementById('stats-table-body');
const statsTableHeader = document.getElementById('stats-table-header');
const teacherInfoPopup = document.getElementById('teacherInfoPopup');
const addTeacherPopup = document.getElementById('addTeacherPopup');

// --- CHART & MAP INSTANCES ---
let map = null;
let statsChart = null;
let pivotTable = null;

// --- RENDER FUNCTIONS ---
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
  if (_.isEmpty(allTeachers) && _.isEmpty(teachers)) {
    container.innerHTML = '<p class="loading-message">Loading teachers...</p>';
    return;
  }
  if (_.isEmpty(teachers)) {
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
  const countryCounts = _.countBy(teachers, 'country');
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
  if (pivotTable) {
    pivotTable.updateData({ data: teachers });
    return;
  }
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
};

// --- DATA MANIPULATION & LOGIC ---
const rerenderAllLists = () => {
  const filteredTeachers = applyFilters(allTeachers);
  renderTeachers(topTeachersGrid, filteredTeachers);
  renderTeachers(favoritesGrid, _.filter(allTeachers, { favorite: true }));
  sortAndRenderStatistics(filteredTeachers);
  renderStatisticsChart(filteredTeachers);
  if (document.getElementById('stats-pivot-view').classList.contains('active')) {
    renderPivotTable(filteredTeachers);
  }
};

const sortAndRenderStatistics = (teachers) => {
  const sortedTeachers = _.orderBy(teachers, [sortState.key], [sortState.direction]);
  statsTableHeader.querySelectorAll('th').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (th.dataset.sortBy === sortState.key) th.classList.add(`sorted-${sortState.direction}`);
  });
  renderStatisticsTable(sortedTeachers);
};

function applyFilters(teachers) {
  const searchTerm = currentSearchTerm.toLowerCase().trim();
  return _.filter(teachers, t => {
    const matchesSearch = _.isEmpty(searchTerm) ||
        _.includes(t.full_name.toLowerCase(), searchTerm) ||
        _.includes(_.get(t, 'note', '').toLowerCase(), searchTerm) ||
        _.includes(String(t.age), searchTerm);
    const ageRange = { '18-30': [18, 31], '31-45': [31, 46], '46+': [46, Infinity] };
    const matchesAge = currentFilters.age === 'all' || (ageRange[currentFilters.age] && t.age >= ageRange[currentFilters.age][0] && t.age < ageRange[currentFilters.age][1]);
    return matchesSearch &&
        (currentFilters.country === 'all' || t.country === currentFilters.country) &&
        (currentFilters.gender === 'all' || t.gender === currentFilters.gender) &&
        (!currentFilters.photo || t.picture_large) &&
        (!currentFilters.favorite || t.favorite) &&
        matchesAge;
  });
}

const calculateAge = (birthDate) => dayjs().diff(dayjs(birthDate), 'year');

// --- POPUP LOGIC ---
const openTeacherInfoPopup = (teacher) => {
  if (!teacher) return;
  const popup = {
    avatar: teacherInfoPopup.querySelector('.info-avatar'), name: teacherInfoPopup.querySelector('.info-name'),
    subject: teacherInfoPopup.querySelector('.info-subject'), ageGender: teacherInfoPopup.querySelector('.info-age-gender'),
    birthday: teacherInfoPopup.querySelector('.info-birthday'), location: teacherInfoPopup.querySelector('.info-location'),
    email: teacherInfoPopup.querySelector('.info-email'), phone: teacherInfoPopup.querySelector('.info-phone'),
    description: teacherInfoPopup.querySelector('.info-description'), star: document.getElementById('popupStar'),
    mapToggle: teacherInfoPopup.querySelector('.info-map-toggle')
  };

  teacherInfoPopup.dataset.currentTeacherId = teacher.id;
  const initials = teacher.full_name.split(' ').map(n => n[0]).join('');
  popup.avatar.innerHTML = teacher.picture_large ? `<img src="${teacher.picture_large}" alt="${teacher.full_name}" referrerpolicy="no-referrer">` : `<div class="initial-avatar" style="background-color: ${teacher.bg_color};"><span class="initials">${initials}</span></div>`;
  popup.name.textContent = teacher.full_name;
  popup.subject.textContent = teacher.course || 'N/A';
  popup.ageGender.textContent = `${teacher.age}, ${teacher.gender}`;
  popup.location.textContent = `${teacher.city || ''}, ${teacher.country || ''}`;
  popup.email.href = `mailto:${teacher.email}`;
  popup.email.textContent = teacher.email;
  popup.phone.textContent = teacher.phone;
  popup.description.textContent = teacher.note;

  const today = dayjs();
  let nextBirthday = dayjs(teacher.b_date).year(today.year());
  if (nextBirthday.isBefore(today, 'day')) nextBirthday = nextBirthday.add(1, 'year');
  const daysUntilBirthday = nextBirthday.diff(today, 'day');
  popup.birthday.textContent = daysUntilBirthday <= 0 ? 'Happy Birthday! 🎉' : `Next birthday in ${daysUntilBirthday + 1} days`;

  const updatePopupStar = (isFavorite) => {
    popup.star.textContent = '★';
    popup.star.classList.toggle('is-favorite', isFavorite);
    popup.star.classList.toggle('not-favorite', !isFavorite);
  };
  updatePopupStar(teacher.favorite);

  const mapContainer = document.getElementById('map');
  mapContainer.style.display = 'none';
  if (map) { map.remove(); map = null; }

  popup.mapToggle.onclick = (e) => {
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

const openAddTeacherPopup = () => addTeacherPopup.classList.add('popup--visible');
const closePopups = () => document.querySelectorAll('.popup').forEach(p => p.classList.remove('popup--visible'));

// --- EVENT HANDLERS & SETUP ---
function setupEventListeners() {
  const searchInput = document.querySelector('.search-input');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const statsTabsContainer = document.querySelector('.stats-tabs');
  const addTeacherForm = document.getElementById('add-teacher-form');
  const popupStar = document.getElementById('popupStar');

  const debouncedSearch = _.debounce(() => {
    currentSearchTerm = searchInput.value;
    rerenderAllLists();
  }, 300);
  searchInput.addEventListener('keyup', debouncedSearch);

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

  document.querySelector('.filters').addEventListener('change', (e) => {
    const { id, value, type, checked } = e.target;
    const filterMap = { 'country-filter': 'country', 'age-filter': 'age', 'gender-filter': 'gender', 'photo-filter': 'photo', 'favorite-filter': 'favorite' };
    if (filterMap[id]) {
      currentFilters[filterMap[id]] = type === 'checkbox' ? checked : value;
      rerenderAllLists();
    }
  });

  statsTableHeader.addEventListener('click', (e) => {
    const target = e.target.closest('th');
    if (!target || !target.dataset.sortBy) return;
    const sortKey = target.dataset.sortBy;
    sortState.key = sortKey;
    sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    rerenderAllLists();
  });

  statsTabsContainer.addEventListener('click', (e) => {
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

  topTeachersGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.teacher-card');
    if (card) openTeacherInfoPopup(_.find(allTeachers, { id: card.dataset.teacherId }));
  });
  favoritesGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.teacher-card');
    if (card) openTeacherInfoPopup(_.find(allTeachers, { id: card.dataset.teacherId }));
  });

  popupStar.addEventListener('click', async () => {
    const teacher = _.find(allTeachers, { id: teacherInfoPopup.dataset.currentTeacherId });
    if (teacher) {
      teacher.favorite = !teacher.favorite;
      rerenderAllLists(); // Re-render all lists to update favorites section
      // Update star in currently open popup
      const star = teacherInfoPopup.querySelector('.info-star');
      star.classList.toggle('is-favorite', teacher.favorite);
      star.classList.toggle('not-favorite', !teacher.favorite);
      // Sync with server
      try {
        await fetch(`http://localhost:3000/teachers/${teacher.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorite: teacher.favorite }),
        });
      } catch (error) { console.error("Failed to update favorite status on server:", error); }
    }
  });

  document.querySelectorAll('.add-teacher-btn:not(#load-more-btn)').forEach(btn => btn.addEventListener('click', openAddTeacherPopup));
  document.querySelectorAll('.popup-close').forEach(btn => btn.addEventListener('click', closePopups));
  document.querySelectorAll('.popup').forEach(p => p.addEventListener('click', (e) => { if(e.target === p) closePopups(); }));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopups(); });

  addTeacherForm.addEventListener('submit', async (e) => { /* Form submission logic */ });
}

function populateFilters() {
  const countryFilter = document.getElementById('country-filter');
  const ageFilter = document.getElementById('age-filter');
  const countries = _.uniq(_.map(allTeachers, 'country').filter(Boolean)).sort();
  countryFilter.innerHTML = '<option value="all">All Countries</option>' + countries.map(c => `<option value="${c}">${c}</option>`).join('');
  if (ageFilter.innerHTML === "") {
    ageFilter.innerHTML = `<option value="all">All Ages</option><option value="18-30">18-30</option><option value="31-45">31-45</option><option value="46+">46+</option>`;
  }
}

async function main() {
  renderTeachers(topTeachersGrid, []); // Show initial loading message
  allTeachers = await getTeachers(1, 50);
  populateFilters();
  rerenderAllLists();
  setupEventListeners();
}

// --- APP ENTRY POINT ---
document.addEventListener('DOMContentLoaded', main);


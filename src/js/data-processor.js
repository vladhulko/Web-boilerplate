const COURSES = [
  'Mathematics', 'Physics', 'English', 'Computer Science', 'Dancing',
  'Chess', 'Biology', 'Chemistry', 'Law', 'Art', 'Medicine', 'Statistics',
];

// This function is now correctly exported
export const capitalize = (str) => {
  if (typeof str !== 'string' || str.length === 0) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getRandomCourse = () => COURSES[Math.floor(Math.random() * COURSES.length)];

const getRandomHexColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

const formatPhoneNumber = (phone) => {
  if (typeof phone !== 'string') return '';
  return phone.replace(/[^\d]/g, '');
};

export const getTeachers = async (page = 1, results = 10) => {
  try {
    const localTeachersPromise = fetch('http://localhost:3000/teachers')
        .then(response => response.ok ? response.json() : [])
        .catch(() => {
          console.warn("Could not fetch local teachers. Is json-server running?");
          return [];
        });

    const randomUsersPromise = fetch(`https://randomuser.me/api/?page=${page}&results=${results}&seed=teachfinder`)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then(data => data.results.map(formatRandomUserData));

    const [localTeachers, randomUsers] = await Promise.all([
      localTeachersPromise,
      randomUsersPromise,
    ]);

    const combinedTeachers = (page === 1) ? [...localTeachers.reverse(), ...randomUsers] : randomUsers;

    return combinedTeachers.filter(validateUser);

  } catch (error) {
    console.error("Failed to load teachers:", error);
    return [];
  }
};

const formatRandomUserData = (user) => {
  return {
    id: user.login.uuid,
    gender: user.gender ? capitalize(user.gender) : '',
    title: user.name.title,
    full_name: `${capitalize(user.name.first)} ${capitalize(user.name.last)}`,
    city: user.location.city ? capitalize(user.location.city) : '',
    state: user.location.state ? capitalize(user.location.state) : '',
    country: user.location.country,
    postcode: user.location.postcode,
    coordinates: user.location.coordinates,
    timezone: user.location.timezone,
    email: user.email,
    b_date: user.dob.date,
    age: user.dob.age,
    phone: formatPhoneNumber(user.phone),
    picture_large: user.picture.large,
    picture_thumbnail: user.picture.thumbnail,
    favorite: Math.random() < 0.2,
    course: getRandomCourse(),
    bg_color: getRandomHexColor(),
    note: 'A brief note about this teacher.',
  };
};

const validateUser = (user) => {
  if (!user.full_name || typeof user.full_name !== 'string' || user.full_name.trim().split(' ').length < 2) return false;
  if (!user.course || typeof user.course !== 'string') return false;
  if (!user.age || typeof user.age !== 'number' || user.age < 18) return false;
  if (!user.phone || typeof user.phone !== 'string' || user.phone.length < 5) return false;
  return true;
};


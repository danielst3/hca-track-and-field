/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AthleteDetail from './pages/AthleteDetail';
import Athletes from './pages/Athletes';
import Calendar from './pages/Calendar';
import FERPACompliance from './pages/FERPACompliance';
import LogActivity from './pages/LogActivity';
import MyAthletes from './pages/MyAthletes';
import Posts from './pages/Posts';
import Privacy from './pages/Privacy';
import Resources from './pages/Resources';
import Seasons from './pages/Seasons';
import Settings from './pages/Settings';
import Support from './pages/Support';
import Today from './pages/Today';
import Progress from './pages/Progress';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AthleteDetail": AthleteDetail,
    "Athletes": Athletes,
    "Calendar": Calendar,
    "FERPACompliance": FERPACompliance,
    "LogActivity": LogActivity,
    "MyAthletes": MyAthletes,
    "Posts": Posts,
    "Privacy": Privacy,
    "Resources": Resources,
    "Seasons": Seasons,
    "Settings": Settings,
    "Support": Support,
    "Today": Today,
    "Progress": Progress,
}

export const pagesConfig = {
    mainPage: "Today",
    Pages: PAGES,
    Layout: __Layout,
};
import { NavLink } from 'react-router-dom';
import logo from '../../assets/image/logo.png';
import { API_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import './SidebarLayout.css';

function SidebarLayout({ children }) {
  const { user, logout } = useAuth();
  const displayName = user?.username || user?.email?.split('@')[0] || 'User';

  return (
    <div className="sidebar-layout">
      <aside className="sidebar-layout__sidebar">
        <div className="sidebar-layout__logo-container">
          <img src={logo} alt="logo" className="sidebar-layout__logo" />
          <p className="sidebar-layout__logo-text">SyncNest</p>
        </div>
        {user && (
          <div className="sidebar-layout__user">
            {user.profilePhotoUrl ? (
              <img
                src={`${API_BASE}${user.profilePhotoUrl}`}
                alt=""
                className="sidebar-layout__avatar"
              />
            ) : (
              <div className="sidebar-layout__avatar sidebar-layout__avatar--placeholder">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="sidebar-layout__user-name">Hello, {displayName}</span>
          </div>
        )}
        <div className="sidebar-layout__nav-container">
          <div className="sidebar-layout__nav-title">Navigation</div>
          <nav className="sidebar-layout__nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `sidebar-layout__nav-link${isActive ? ' sidebar-layout__nav-link--active' : ''}`
              }
            >
              <span>Dashboard</span>
              <svg className="sidebar-layout__nav-icon" width="24" height="24" viewBox="0 0 22 21" version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinejoin: 'round', strokeMiterlimit: 2 }}>
                <g transform="matrix(1,0,0,1,-396.912506,-980.784496)">
                    <path d="M418.072,991.786L417.872,991.703L407.634,981.465L397.395,991.703C397.285,991.813 397.105,991.813 396.995,991.703C396.885,991.593 396.885,991.413 396.995,991.303L407.434,980.864C407.54,980.758 407.728,980.758 407.834,980.864L418.272,991.303C418.384,991.413 418.384,991.593 418.272,991.703L418.072,991.786Z" style={{ fill: 'currentColor', fillRule: 'nonzero' }} />
                    <path d="M415.269,1001.5L410.231,1001.5C410.075,1001.5 409.948,1001.37 409.948,1001.21L409.948,993.985C409.948,993.985 406.09,992.781 405.319,993.985C404.548,995.189 405.319,1001.21 405.319,1001.21C405.319,1001.37 405.192,1001.5 405.036,1001.5L399.999,1001.5C399.843,1001.5 399.716,1001.37 399.716,1001.21L399.716,988.942C399.716,988.786 399.843,988.659 399.999,988.659C400.156,988.659 400.283,988.786 400.283,988.942L400.283,1000.93L404.753,1000.93L404.753,993.701C404.753,993.545 404.88,993.418 405.036,993.418L410.231,993.418C410.388,993.418 410.515,993.545 410.515,993.701L410.515,1000.93L414.985,1000.93L414.985,988.942C414.985,988.786 415.111,988.659 415.269,988.659C415.425,988.659 415.552,988.786 415.552,988.942L415.552,1001.21C415.552,1001.37 415.425,1001.5 415.269,1001.5Z" style={{ fill: 'currentColor', fillRule: 'nonzero' }} />
                </g>
              </svg>
            </NavLink>
            <NavLink
              to="/calendar"
              className={({ isActive }) =>
                `sidebar-layout__nav-link${isActive ? ' sidebar-layout__nav-link--active' : ''}`
              }
            >
              Calendar
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `sidebar-layout__nav-link${isActive ? ' sidebar-layout__nav-link--active' : ''}`
              }
            >
              Settings
            </NavLink>
          </nav>
        </div>
        {user && (
          <button type="button" className="sidebar-layout__logout" onClick={logout}>
            Log out
          </button>
        )}
      </aside>
      <main className="sidebar-layout__content">{children}</main>
    </div>
  );
}

export default SidebarLayout;


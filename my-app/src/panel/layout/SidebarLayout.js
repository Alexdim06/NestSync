import { NavLink } from 'react-router-dom';
import logo from '../../assets/image/logo.png';
import './SidebarLayout.css';

function SidebarLayout({ children }) {
  return (
    <div className="sidebar-layout">
      <aside className="sidebar-layout__sidebar">
        <div className="sidebar-layout__logo-container">
          <img src={logo} alt="logo" className="sidebar-layout__logo" />
          <p className="sidebar-layout__logo-text">SyncNest</p>
        </div>
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
              Начало
            </NavLink>
            <NavLink
              to="/calendar"
              className={({ isActive }) =>
                `sidebar-layout__nav-link${isActive ? ' sidebar-layout__nav-link--active' : ''}`
              }
            >
              Календар
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `sidebar-layout__nav-link${isActive ? ' sidebar-layout__nav-link--active' : ''}`
              }
            >
              Настройки
            </NavLink>
          </nav>
        </div>
      </aside>
      <main className="sidebar-layout__content">{children}</main>
    </div>
  );
}

export default SidebarLayout;


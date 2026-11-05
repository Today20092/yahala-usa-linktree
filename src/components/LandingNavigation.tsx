import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from './ui/navigation-menu'

export default function LandingNavigation({
  baseUrl,
  currentPath,
}: {
  baseUrl: string
  currentPath: string
}) {
  const links = [
    { label: 'Watch', href: `${baseUrl}#watch` },
    { label: 'Stories', href: `${baseUrl}stories` },
    { label: 'Follow', href: `${baseUrl}#follow` },
    { label: 'About', href: `${baseUrl}about` },
    { label: 'Contact', href: `${baseUrl}contact` },
  ]
  return (
    <NavigationMenu
      aria-label="Primary navigation"
      className="landing-navigation"
    >
      <NavigationMenuList className="landing-navigation__links">
        {links.map(({ label, href }) => (
          <NavigationMenuItem key={label}>
            <NavigationMenuLink
              variant="trigger"
              href={href}
              aria-current={href === currentPath ? 'page' : undefined}
            >
              {label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

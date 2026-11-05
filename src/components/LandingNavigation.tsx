import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from './ui/navigation-menu'

export default function LandingNavigation({ baseUrl }: { baseUrl: string }) {
  return (
    <NavigationMenu
      aria-label="Primary navigation"
      className="landing-navigation"
    >
      <NavigationMenuList className="landing-navigation__links">
        <NavigationMenuItem>
          <NavigationMenuLink variant="trigger" href="#watch">
            Watch
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink variant="trigger" href={`${baseUrl}stories`}>
            Stories
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink variant="trigger" href="#follow">
            Follow
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink variant="trigger" href={`${baseUrl}about`}>
            About
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink variant="trigger" href="#contact">
            Contact
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

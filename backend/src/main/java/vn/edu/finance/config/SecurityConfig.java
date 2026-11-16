package vn.edu.finance.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
@Configuration public class SecurityConfig {
 @Bean SecurityFilterChain filter(HttpSecurity http,@Value("${app.frontend-url}") String frontend) throws Exception {
  return http.csrf(csrf->csrf.csrfTokenRepository(new org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository()))
   .authorizeHttpRequests(a->a.requestMatchers("/actuator/health","/error","/api/csrf","/api/session").permitAll().anyRequest().authenticated())
   .oauth2Login(o->o.defaultSuccessUrl(frontend+"/",true))
   .exceptionHandling(e->e.defaultAuthenticationEntryPointFor(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),r->r.getRequestURI().startsWith("/api/")))
   .logout(l->l.logoutUrl("/logout").logoutSuccessUrl(frontend+"/").invalidateHttpSession(true).deleteCookies("JSESSIONID"))
   .build();
 }
}

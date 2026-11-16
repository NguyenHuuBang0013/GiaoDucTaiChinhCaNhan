package vn.edu.finance.controller;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import vn.edu.finance.service.*;
@RestController @RequestMapping("/api/learning") public class LearningController {
 private final LearningService learning;private final AccountService account;
 public LearningController(LearningService learning,AccountService account){this.learning=learning;this.account=account;}
 @GetMapping("/lessons") public Object lessons(@AuthenticationPrincipal OidcUser u){return learning.lessons(account.user(u));}
 @GetMapping("/progress") public Object progress(@AuthenticationPrincipal OidcUser u){return learning.progress(account.user(u));}
 @GetMapping("/lessons/{id}/questions") public Object questions(@AuthenticationPrincipal OidcUser u,@PathVariable int id){return learning.questions(account.user(u),id);}
 @PostMapping("/questions/{id}/answer") public Object questionAnswer(@AuthenticationPrincipal OidcUser u,@PathVariable long id,@RequestBody Map<String,String> body){return learning.answerQuestion(account.user(u),id,body.get("answer"));}
 @PostMapping("/lessons/{id}/answer") public Object answer(@AuthenticationPrincipal OidcUser u,@PathVariable int id,@RequestBody Map<String,String> body){return learning.answer(account.user(u),id,body.get("answer"));}
}

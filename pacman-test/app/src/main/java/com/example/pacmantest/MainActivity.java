package com.example.pacmantest;
import android.app.Activity;
import android.os.Bundle;
import android.view.*;
import android.graphics.*;
public class MainActivity extends Activity {
 public void onCreate(Bundle b){super.onCreate(b);setContentView(new Game());}
 class Game extends View {
  Paint p=new Paint(3); float x=180,y=180; int score=0; float[][] dots={{100,100},{300,100},{100,300},{300,300},{200,400}};
  Game(){super(MainActivity.this);setFocusable(true);}
  protected void onDraw(Canvas c){super.onDraw(c);c.drawColor(Color.BLACK);p.setColor(Color.YELLOW);c.drawCircle(x,y,35,p);p.setColor(Color.WHITE);p.setTextSize(42);c.drawText("PACMAN  Score: "+score,25,60,p);for(float[] d:dots)if(d[0]>=0)c.drawCircle(d[0],d[1],9,p);invalidate();}
  public boolean onTouchEvent(android.view.MotionEvent e){if(e.getAction()==1){float dx=e.getX()-x,dy=e.getY()-y;float len=(float)Math.sqrt(dx*dx+dy*dy);if(len>0){x+=dx/len*45;y+=dy/len*45;}for(float[] d:dots)if(d[0]>=0&&Math.hypot(x-d[0],y-d[1])<45){d[0]=-1;score++;}invalidate();}return true;}
 }
}
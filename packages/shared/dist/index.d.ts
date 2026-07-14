export interface AppConfig {
  environment: string;
  port: number;
}
export declare function createAppConfig(environment: string, port: number): AppConfig;

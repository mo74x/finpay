/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import bull from 'bull';

@Processor('invoice-queue')
export class NotificationsProcessor {
    private readonly logger = new Logger(NotificationsProcessor.name);

    //Runs Auto whenever a jop enters the 'invoice-queue' queue
    @Process('generate_invoice_and_notify')
  async handleInvoiceJob(job: bull.Job<{ transactionRef: string; email: string; amount: number }>) {
    this.logger.log(`[STARTED] Processing job ${job.id} for TRX: ${job.data.transactionRef}`);

    try {
      // Simulate heavy PDF Generation
      this.logger.log('Generating PDF Invoice...');
      await this.sleep(1500); 

      // Simulate Third-Party Email API
      this.logger.log(`Sending email to ${job.data.email}...`);
      await this.sleep(1000); 

      this.logger.log(`[COMPLETED] Invoice sent successfully for ${job.data.transactionRef}`);
    } catch (error) {
      this.logger.error(`Job failed: ${error.message}`);
      throw error; 
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
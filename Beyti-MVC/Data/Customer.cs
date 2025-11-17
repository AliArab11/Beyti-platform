using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti.Data;

[Table("Customer")]
[Index("UserProfileId", Name = "IX_Customer_UserProfile")]
[Index("UserProfileId", Name = "UQ__Customer__9E267F63A7921533", IsUnique = true)]
public partial class Customer
{
    [Key]
    public int Id { get; set; }

    public int UserProfileId { get; set; }

    [StringLength(30)]
    public string Phone { get; set; } = null!;

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }

    [InverseProperty("Customer")]
    public virtual ICollection<CustomerAddress> CustomerAddresses { get; set; } = new List<CustomerAddress>();

    [InverseProperty("Customer")]
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    [InverseProperty("Customer")]
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    [InverseProperty("Customer")]
    public virtual ICollection<ServiceBooking> ServiceBookings { get; set; } = new List<ServiceBooking>();

    [InverseProperty("Customer")]
    public virtual ICollection<ServiceReview> ServiceReviews { get; set; } = new List<ServiceReview>();

    [ForeignKey("UserProfileId")]
    [InverseProperty("Customer")]
    public virtual UserProfile UserProfile { get; set; } = null!;
}
